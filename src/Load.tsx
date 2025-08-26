import { useGlobals, type SaveableCtx } from './context'
import type { TelegramExport } from './types'

declare global {
	interface File {
		$relativePath: string
	}
}

export function Load() {
	const ctx = useGlobals()

	return (
		<>
			<div className="card">
				<p>Select telegram export directory to begin</p>
				<input
					type="file"
					// @ts-expect-error non standart behavior
					webkitdirectory=""
					mozdirectory=""
					directory=""
					onChange={event => {
						const files = [...(event.target.files ?? [])]
						files.forEach(
							e =>
								(e.$relativePath = e.webkitRelativePath.replace(/[^/]+\//, '')),
						)

						ctx.set({ files })

						parseResult(files, ctx)
					}}
				/>
			</div>
		</>
	)
}

async function parseResult(files: File[], ctx: SaveableCtx) {
	const state = (s: string) => ctx.set({ loadingState: s })

	const resultFile = files.find(e => e.$relativePath === 'result.json')

	if (!resultFile)
		return state('no result.json file found, please select right directory')

	let resultParsed: TelegramExport.Result
	try {
		state('reading file...')
		const resultText = await resultFile.text()
		state('parsing file...')
		try {
			resultParsed = JSON.parse(resultText)
		} catch (e) {
			state(
				'error while parsing source file: ' +
					e +
					"\n\nIt may be because telegram hasn't finished export yet.",
			)
			return
		}

		state('done!')
		ctx.set({ result: resultParsed })
	} catch (e) {
		state('error while loading source file: ' + e)
		return
	}

	try {
		const chat1 = resultParsed.chats.list.find(e => e.type === 'personal_chat')
		const chat2 = resultParsed.chats.list.find(
			e => e !== chat1 && e.type === 'personal_chat',
		)
		const selfId = chat1?.messages.find(e =>
			chat2?.messages.some(e2 => e2.from_id === e.from_id),
		)?.from_id

		if (selfId) {
			ctx.set({ selfId: selfId ?? '' })
		} else {
			console.log('no selfId found', { chat1, chat2, selfId })
		}
	} catch (e) {
		state('error while loading selfId: ' + e)
	}
}
