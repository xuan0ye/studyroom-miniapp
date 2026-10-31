// Convert only the photo selected by the member. Never fall back to an unprocessed original.
export async function prepareFacePhoto(api, page, path, isCurrent) {
	let expired = false
	let timer
	const files = []
	const fs = api.getFileSystemManager && api.getFileSystemManager()
	const current = () => !expired && isCurrent()
	const check = () => { if (!current()) throw new Error('本次照片处理已取消') }
	const remove = file => {
		if (file && file !== path && fs && fs.unlink) {
			try { fs.unlink({ filePath: file, fail: () => {} }) } catch (error) { /* temporary-file cleanup is best effort */ }
		}
	}
	const call = (owner, method, options) => new Promise((resolve, reject) => {
		check()
		const request = { ...options, success: value => {
			if (method === 'canvasToTempFilePath' && value.tempFilePath) {
				if (current()) files.push(value.tempFilePath)
				else remove(value.tempFilePath)
			}
			try { check(); resolve(value) } catch (error) { reject(error) }
		}, fail: () => reject(new Error('照片处理失败，请重新拍摄或选择其他照片')) }
		if (method === 'canvasToTempFilePath') owner[method](request, page)
		else owner[method](request)
	})
	const work = async () => {
		if (!fs || !fs.getFileInfo || !fs.readFile) throw new Error('当前环境无法处理照片，请重新进入小程序')
		const info = await call(api, 'getImageInfo', { src: path })
		if (!(Number.isFinite(info.width) && Number.isFinite(info.height) && info.width > 0 && info.height > 0)) throw new Error('照片尺寸无效，请重新选择')
		const ratio = Math.min(1, 800 / info.width, 800 / info.height)
		const width = Math.max(1, Math.round(info.width * ratio)), height = Math.max(1, Math.round(info.height * ratio))
		const canvas = api.createCanvasContext('faceCanvas', page)
		// A white background also handles transparent PNGs and avoids old canvas pixels.
		canvas.clearRect(0, 0, 800, 800)
		canvas.setFillStyle('#ffffff'); canvas.fillRect(0, 0, 800, 800)
		canvas.drawImage(info.path || path, 0, 0, width, height)
		await new Promise((resolve, reject) => canvas.draw(false, () => {
			try { check(); resolve() } catch (error) { reject(error) }
		}))
		for (const quality of [0.7, 0.5, 0.35]) {
			const output = await call(api, 'canvasToTempFilePath', {
				canvasId: 'faceCanvas', width, height, destWidth: width, destHeight: height, fileType: 'jpg', quality
			})
			const file = output.tempFilePath
			if (!file) throw new Error('照片处理失败，请重新选择')
			const detail = await call(fs, 'getFileInfo', { filePath: file })
			if (!(detail.size > 0) || detail.size > 225000) continue
			const result = await call(fs, 'readFile', { filePath: file, encoding: 'base64' })
			if (typeof result.data === 'string' && result.data.startsWith('/9j/') && result.data.length <= 300000) return result.data
		}
		throw new Error('照片仍然太大或格式不合适，请重新拍摄一张正脸照片')
	}
	try {
		return await Promise.race([
			work(),
			new Promise((resolve, reject) => { timer = setTimeout(() => {
				expired = true; reject(new Error('照片处理超时，请重新选择照片'))
			}, 8000) })
		])
	} finally {
		expired = true
		clearTimeout(timer)
		files.forEach(remove)
	}
}
