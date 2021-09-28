const { spawnProcess, spinnerStart } = require('../utils/index')
const userHome = require('userhome')
const fs = require('fs')
const fes = require('fs-extra')
const Git = require('simple-git')
const path = require('path')
const OSS = require('./oss')
const glob = require('glob')
const DEFAULT_CACHE_DIR = '.rookie-cli'
const DIST_DIR = 'project'
const COMMAND_NAME = ['npm', 'cnpm']
const ERR_OK = 0
const ERR_FAIL = 1
const REDIS_PREFIX_KEY = 'build'
const BUILD_DIR_LIST = ['build', 'dist']

class CloudBuildTask {
  constructor (options, ctx) {
    // options: 
      // name, 项目名称
      // version 项目版本
      // remoteRepoUrl 项目远程仓库地址
      // branch 发布所处分支
      // buildCommand 打包命令
    // socket socket通信对象
    console.log(options, 'cloudbuildtask')
    const { name, version, branch, buildCommand, remoteRepoUrl } = options
    this.cachedDir = null // 代码存放的总目录
    this.sourceDir = null // 源码存放的目录
    this.version = version
    this.name = name
    this.projectName = `${this.name}@${this.version}`
    this.remoteRepoUrl = remoteRepoUrl
    this.branch = branch
    this.buildCommand = buildCommand
    this.git = null
    this.ctx = ctx
    this.socket = ctx.socket
    this.oss = null // oss存储对象发布到oss上
    console.log(options)
  }
  isExistsHome () {
    const userHomeDir = userHome()
    if (!fs.existsSync(userHomeDir)) {
      return false
    }
    this.cachedDir = path.resolve(userHomeDir, DEFAULT_CACHE_DIR, DIST_DIR)
    fes.ensureDirSync(this.cachedDir)
    // fes.emptyDirSync(this.cachedDir)
    const sourceDir = path.resolve(this.cachedDir, this.projectName)
    this.sourceDir = sourceDir
    console.log(fs.existsSync(sourceDir), 'is')
    if (fs.existsSync(sourceDir)) {
      // 删除目录
      fes.removeSync(sourceDir)
    }
    return true
  }
  gitInit (dir) {
    this.git = new Git(dir)
  }
  async clone () {
    return new Promise(async (resolve, reject) => {
      // 拉取远程代码并且将名字改为 name@version形式
      const spinner = spinnerStart('downloading remoteRepo')
      await this.git.clone(this.remoteRepoUrl, this.projectName)
      spinner.stop(true)
      // // 源代码目录为
      this.sourceDir = path.resolve(this.cachedDir, this.projectName)
      console.log(this.sourceDir, fs.existsSync(this.sourceDir))
      if (!fs.existsSync(this.sourceDir)) {
        return resolve({ code: ERR_FAIL, message: 'Fail to clone repository' })
      }
      // 初始化git
      this.gitInit(this.sourceDir)
      resolve({ code: ERR_OK, message: 'Clone repository successfully' })
    })
  }
  async checkoutBranch () { // 切换到对应的分支代码上
    await this.git.checkout(['-b', this.branch, `origin/${this.branch}`])
  }
  async install () {
    return new Promise((resolve, reject) => {
      const childProcess = this.execCommand('npm i', {
        cwd: this.sourceDir,
        stdio: 'pipe'
      })
      childProcess.on('error', () => {
        resolve({ code: ERR_FAIL, message: 'Failed to install dependencies' })
      })
      childProcess.on('exit', () => {
        resolve({ code: ERR_OK, message: 'Install dependencies successfully' })
      })
      childProcess.stderr.on('data', data => {
        this.socket.compress(true).emit('building', data.toString())
      })
      childProcess.stdout.on('data', data => {
        this.socket.compress(true).emit('building', data.toString())
      })
    })
  }
  async build () {
    return new Promise((resolve, reject) => {
      const isValid = this.isValidCommand(this.buildCommand)
      if (!isValid) {
        resolve({ code: ERR_FAIL, message: 'Invalid build command, must begin with npm/cnpm' })
      }
      const childProcess = this.execCommand(this.buildCommand, {
        cwd: this.sourceDir,
        stdio: 'pipe'
      })
      childProcess.on('error', () => {
        resolve({ code: ERR_FAIL, message: 'Failed to cloud build' })
      })
      childProcess.on('exit', () => {
        resolve({ code: ERR_OK, message: 'Cloud build successfully' })
      })
      childProcess.stderr.on('data', data => {
        this.socket.compress(true).emit('building', data.toString())
      })
      childProcess.stdout.on('data', data => {
        this.socket.compress(true).emit('building', data.toString())
      })
    })
  }
  async clear () { // 清空缓存目录及任务数据
    if (fs.existsSync(this.sourceDir)) {
      // 删除目录
      fes.removeSync(this.sourceDir)
    }
    this.oss = null // 释放OSS对象
    const id = this.socket.id
    console.log(id, 'id')
    await this.ctx.redis.del(`${REDIS_PREFIX_KEY}:${id}`)
  }
  checkPublishDir () { // 检查发布目录是否存在
    return new Promise((resolve, reject) => {
      const fileList = BUILD_DIR_LIST.map(dirName => path.resolve(this.sourceDir, dirName))
      const isExist = fileList.some(path => fs.existsSync(path))
      if (isExist) {
        // 确认发布目录存在，实例化OSS对象
        this.oss = new OSS()
        resolve()
      } else {
        reject(new Error('publish directory not found'))
      }
    })
  }
  async publish () {
    return new Promise((resolve, reject) => {
      const fileList = glob.sync('**', {
        cwd: path.resolve(this.sourceDir, 'dist'),
        nodir: true,
        ignore: ['node_modules']
      })
      console.log(fileList, 'fileList')
      Promise.all(fileList.map(file => {
        // return new Promise(async (resolve, reject) => {
        //   try {
        //     const remotePath = `${this.projectName}/${file}` // test@1.2.3/index.html
        //     const localPath = path.resolve(this.sourceDir, 'dist', file)
        //     console.log(remotePath, localPath, 'file-item', )
        //     await this.oss.upload(remotePath, localPath, {})
        //     resolve()
        //   } catch (err) {
        //     reject(err)
        //   }
        // }) 
        const remotePath = `${this.projectName}/${file}` // test@1.2.3/index.html
        const localPath = path.resolve(this.sourceDir, 'dist', file)  
        return this.oss.upload(remotePath, localPath, {})     
      })).then(() => {
        console.log("resolve upload")
        resolve()
      }).catch((err) => reject(err))
    })
  }
  isValidCommand (command) {
    const commandArr = command.split(' ')
    const mainCmd = commandArr[0]
    if (!COMMAND_NAME.includes(mainCmd)) {
      return false
    }
    return true
  }
  execCommand (command, options) {
    const commandArr = command.split(' ')
    const mainCmd = commandArr[0]
    const retCmd = commandArr.slice(1)
    return spawnProcess(mainCmd, retCmd, options)
  }
}

module.exports = CloudBuildTask