import { describe, it, expect, vi } from 'vitest'
import { constructSshUrl, replaceHttpsWithSsh } from './index'
import * as childProcess from 'child_process'

vi.mock('child_process', () => ({
  exec: vi.fn()
}))

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn)
}))

describe('Git Origin Replacer', () => {
  it('should construct SSH URL correctly', () => {
    const httpsUrl = 'https://github.com/username/repo.git'
    const expectedSshUrl = 'git@github.com:username/repo.git'
    expect(constructSshUrl(httpsUrl)).toBe(expectedSshUrl)
  })

  it('should throw error for invalid HTTPS URL', () => {
    const invalidUrl = 'https://invalid-url.com'
    expect(() => constructSshUrl(invalidUrl)).toThrow(
      'Could not parse the GitHub HTTPS URL.'
    )
  })

  it('should not change URL if already using SSH', async () => {
    vi.mocked(childProcess.exec).mockImplementation(
      () =>
        Promise.resolve({
          stdout: 'git@github.com:username/repo.git\n',
          stderr: ''
        }) as any
    )

    const result = await replaceHttpsWithSsh()
    expect(result).toBe('The remote is already using SSH.')
  })

  it('should change HTTPS URL to SSH', async () => {
    const execMock = vi.mocked(childProcess.exec)
    execMock.mockImplementationOnce(
      () =>
        Promise.resolve({
          stdout: 'https://github.com/username/repo.git\n',
          stderr: ''
        }) as any
    )
    execMock.mockImplementationOnce(
      () => Promise.resolve({ stdout: '', stderr: '' }) as any
    )

    const result = await replaceHttpsWithSsh()
    expect(result).toBe(
      'Successfully changed remote URL to: git@github.com:username/repo.git'
    )
    expect(execMock).toHaveBeenCalledWith(
      'git remote set-url origin git@github.com:username/repo.git'
    )
  })
})
