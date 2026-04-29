import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { Button } from './components/ui/button'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Button onClick={ipcHandle} className="mb-4">
        Send Ping
      </Button>
    </>
  )
}

export default App
