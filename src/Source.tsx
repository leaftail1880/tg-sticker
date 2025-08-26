import { useState } from 'react'
import { useGlobals, type SaveableCtx } from './context'
import type { TelegramExport } from './types'

interface SourceFilterCtx {
	minNumberOfStickers: number
	myOnly: boolean
	startDate: number
	endDate: number
}

export function Source() {
	const [collapsed, setCollapsed] = useState(false)
	const [minNumberOfStickers, setMinNumberOfStickers] = useState(0)
	const myOnly = useToggle('My messages only', true)
	const filterCtx: SourceFilterCtx = {
		minNumberOfStickers,
		myOnly: myOnly.value,
		startDate: new Date(2025, 0, 0, 0, 0, 0, 0).getTime() / 1000,
		endDate: Date.now(),
	}
	const ctx = useGlobals()
	return (
		<div style={{ width: '100%' }}>
			<div>
				<h2>Source</h2>
				<div
					style={{
						flexDirection: 'row',
						justifyItems: 'center',
						alignItems: 'center',
						display: 'flex',
						gap: 10,
					}}
				>
					<button onClick={() => setCollapsed(!collapsed)}>Collapse</button>
					Min number of stickers
					<input
						type="number"
						defaultValue={minNumberOfStickers}
						onBlur={e => setMinNumberOfStickers(e.target.valueAsNumber)}
					></input>
					{myOnly.button}
				</div>
				{!collapsed && (
					<div
						style={{
							flexDirection: 'row',
							justifyContent: 'center',
							display: 'inline-flex',
							gap: 10,
						}}
					>
						<SourceGroup name="Groups" filter={isGroup} ctx={filterCtx} />
						<SourceGroup
							name="Private chats"
							filter={e => !isGroup(e)}
							ctx={filterCtx}
						/>
					</div>
				)}
			</div>
			<ViewStickers
				chats={
					ctx.result?.chats.list.filter(
						e => !isIgnored(e, filterCtx) && isSelected(e, ctx),
					) ?? []
				}
				filterCtx={filterCtx}
			/>
		</div>
	)
}

function SourceGroup(props: {
	name: string
	filter: typeof isGroup
	ctx: SourceFilterCtx
}) {
	const ctx = useGlobals()
	const [sort, setSort] = useState(true)

	const chats =
		ctx.result?.chats.list.filter(
			e => props.filter(e) && !isIgnored(e, props.ctx),
		) ?? []

	if (sort)
		chats.sort((a, b) => getCount(b, props.ctx) - getCount(a, props.ctx))

	return (
		<div>
			<h3>Type: {props.name}</h3>
			<button style={{ marginBottom: 10 }} onClick={() => setSort(!sort)}>
				Sort: {sort ? 'Amount' : 'Default'}
			</button>
			<div>
				{chats.map(e => (
					<button
						onClick={() =>
							ctx.ignoreChats.includes(e.id)
								? ctx.set({
										ignoreChats: ctx.ignoreChats.filter(c => c !== e.id),
								  })
								: ctx.set({ ignoreChats: [...ctx.ignoreChats, e.id] })
						}
						style={{ opacity: isSelected(e, ctx) ? 1 : 0.4, margin: 2 }}
						key={e.id}
					>
						{e.name || e.id} <strong>{getCount(e, props.ctx)}</strong>
					</button>
				))}
			</div>
		</div>
	)
}

function isGroup(chat: TelegramExport.Chat) {
	return chat.type.includes('group')
}

function getType(chat: TelegramExport.Chat) {
	return isGroup(chat) ? 'group' : 'dm'
}

function isIgnored(chat: TelegramExport.Chat, ctx: SourceFilterCtx) {
	const count = getCount(chat, ctx)
	return count < ctx.minNumberOfStickers
}

function isSelected(chat: TelegramExport.Chat, ctx: SaveableCtx) {
	return (
		!ctx.ignoreTypes.includes(getType(chat)) &&
		!ctx.ignoreChats.includes(chat.id)
	)
}

function getStickerMessages(chat: TelegramExport.Chat, ctx: SourceFilterCtx) {
	let messages = chat.messages.filter(
		e => e.media_type === 'sticker',
	) as TelegramExport.StickerMessage[]

	if (ctx.myOnly) messages = messages.filter(e => e.from !== chat.name)

	if (ctx.startDate)
		messages = messages.filter(e => parseInt(e.date_unixtime) > ctx.startDate)

	return messages
}

function getCount(chat: TelegramExport.Chat, ctx: SourceFilterCtx) {
	return getStickerMessages(chat, ctx).length
}

function ViewStickers({
	chats,
	filterCtx,
}: {
	chats: TelegramExport.Chat[]
	filterCtx: SourceFilterCtx
}) {
	const view = useToggle('View')

	return (
		<div style={{ width: '100%' }}>
			{view.button}
			{view.value && <RenderView chats={chats} filterCtx={filterCtx} />}
		</div>
	)
}

function useToggle(name: string, defaultValue = false) {
	const [v, setV] = useState(defaultValue)
	return {
		value: v,
		button: (
			<button onClick={() => setV(!v)}>
				{name}: {v ? 'yes' : 'no'}
			</button>
		),
	}
}

function RenderView({
	chats,
	filterCtx,
}: {
	chats: TelegramExport.Chat[]
	filterCtx: SourceFilterCtx
}) {
	const ctx = useGlobals()
	const files = ctx.files
	const allStickers = chats
		.map(e => getStickerMessages(e, filterCtx))
		.flat()
		.map(e => e.thumbnail)

	const uniqueStickers = new Map<string, { file: File; count: number }>()
	for (const relativePath of allStickers) {
		const prev = uniqueStickers.get(relativePath)
		if (prev) {
			uniqueStickers.set(relativePath, { ...prev, count: prev.count + 1 })
		} else {
			const file = files.find(f => f.$relativePath === relativePath)
			if (!file) continue
			uniqueStickers.set(relativePath, { file, count: 1 })
		}
	}

	return (
		<div className="grid-container">
			{[...uniqueStickers.values()]
				.sort((a, b) => b.count - a.count)
				.map(e => (
					<div
						key={e.file.$relativePath}
						style={{
							display: 'flex',
							flex: 1,
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						<img src={URL.createObjectURL(e.file)} width={50} height={50}></img>
						{e.count}
					</div>
				))}
		</div>
	)
}
