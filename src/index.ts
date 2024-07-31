import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function getRemoteUrl(): Promise<string> {
  const { stdout } = await execAsync('git config --get remote.origin.url')
  return stdout.trim()
}

export async function setRemoteUrl(url: string) {
  await execAsync(`git remote set-url origin ${url}`)
}

export function constructSshUrl(httpsUrl: string): string {
  const match = httpsUrl.match(/https:\/\/github\.com\/(.+)\/(.+)\.git/)
  if (!match) {
    throw new Error('Could not parse the GitHub HTTPS URL.')
  }
  const [, username, repo] = match
  return `git@github.com:${username}/${repo}.git`
}

export async function replaceHttpsWithSsh() {
  const remoteUrl = await getRemoteUrl()

  if (remoteUrl.startsWith('git@github.com:')) {
    console.log(`The remote ${remoteUrl} is already using SSH.`)
    return
  }

  const sshUrl = constructSshUrl(remoteUrl)
  await setRemoteUrl(sshUrl)

  console.log(`Successfully changed remote URL to: ${sshUrl}`)
}
