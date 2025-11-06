import React, { createContext, useContext, useState } from 'react'
import type { TelegramExport } from './types'

interface Ctx {
	files: File[]
	result: TelegramExport.Result | undefined
	users: { id: string; name: string }[]
	loadingState: string
	ignoreTypes: string[]
	ignoreChats: number[]
	selfId: string
}

export interface SaveableCtx extends Ctx {
	set(ctx: Partial<Ctx>): void
}

const defaultContext: SaveableCtx = {
	files: [],
	result: undefined,
	loadingState: '',
	ignoreChats: [],
	users: [],
	ignoreTypes: [],
	selfId: '',
	set() {},
}

const GlobalContext = createContext<SaveableCtx>(defaultContext)

// eslint-disable-next-line react-refresh/only-export-components
export function useGlobals() {
	return useContext(GlobalContext)
}

export function GlobalContextProvider(props: { children: React.ReactNode }) {
	const [ctx, setCtx] = useState<Ctx>(defaultContext)
	console.log('global context provider render', ctx)
	return (
		<GlobalContext.Provider
			value={{
				...ctx,
				set: newCtx => (
					console.log('State update', newCtx),
					setCtx(v => ({ ...v, ...newCtx }))
				),
			}}
		>
			{props.children}
		</GlobalContext.Provider>
	)
}
