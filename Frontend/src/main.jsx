import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/index.css'
import App from './app/App.jsx'
import { Provider } from 'react-redux'
import store from './app/store'
import { MathJaxContext } from 'better-react-mathjax'

const mathJaxConfig = {
  loader: { load: ['input/tex', 'output/chtml'] },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
  },
};
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MathJaxContext version={3} config={mathJaxConfig}>
      <Provider store={store}>
        <App />
      </Provider>
    </MathJaxContext>
  </StrictMode>,
)
