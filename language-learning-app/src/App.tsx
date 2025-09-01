import Exercise from './components/Exercise';
import { exercises } from './data/exercises';
import './App.css';

function App() {
  return (
    <div>
      <nav className="navbar navbar-dark bg-primary">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">Language Learning App</span>
        </div>
      </nav>
      <main>
        <Exercise exercises={exercises} />
      </main>
    </div>
  );
}

export default App;