import './App.css'
import { Load } from './Load'
import { LoadingState } from './LoadingState'
import { Source } from './Source'

function App() {
	return (
		<>
			<h1>Telegram sticker analyzier</h1>
			<LoadingState />
			<Load />
			<Source />
		</>
	)
}

export default App

