const { spawnProcess, spinnerStart } = require('../utils/index')
const userHome = require('userhome')
const fs = require('fs')
const fes = require('fs-extra')

const Git = require('simple-git')
const path = require('path')
const DEFAULT_CACHE_DIR = '.rookie-cli'
const DIST_DIR = 'project'
const COMMAND_NAME = ['npm', 'cnpm']
const ERR_OK = 0
const ERR_FAIL = 1

class CloudBuildTask {
  constructor (options, socket) {
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
    this.socket = socket
    console.log(options, socket)
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
        resolve({ code: ERR_FAIL, message: 'Invalid build command, must start with npm/cnpm' })
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