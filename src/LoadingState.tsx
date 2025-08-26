import { useGlobals } from './context'

export function LoadingState() {
	const ctx = useGlobals()
	const state = ctx.loadingState
	return <p>State: {state}</p>
}
