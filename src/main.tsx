import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import './styles/legacy.css'
import './styles/audit.css'
import { AuditApp } from './audit/AuditApp'

createRoot(document.getElementById('root')!).render(<StrictMode><AuditApp /></StrictMode>)
