import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { GenealogyList } from './pages/GenealogyList'
import GenealogyDetail from './pages/GenealogyDetail'
import GenealogyEdit from './pages/GenealogyEdit'
import { GenealogyForm } from './pages/GenealogyForm'
import { GenealogyView } from './pages/GenealogyView'
import { PersonForm } from './pages/PersonForm'
import PersonDetail from './pages/PersonDetail'
import { RelationshipForm } from './pages/RelationshipForm'
import { GenealogyTreeView } from './pages/GenealogyTreeView'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } 
            />
            <Route path="/genealogies" element={<ProtectedRoute requireAuth={true}><GenealogyList /></ProtectedRoute>} />
            <Route path="/genealogies/create" element={<ProtectedRoute requireAuth={true}><GenealogyForm /></ProtectedRoute>} />
            <Route path="/genealogies/:id" element={<ProtectedRoute requireAuth={true}><GenealogyView /></ProtectedRoute>} />
            <Route path="/genealogies/:id/tree" element={<ProtectedRoute requireAuth={true}><GenealogyTreeView /></ProtectedRoute>} />
            <Route path="/genealogies/:id/edit" element={<ProtectedRoute requireAuth={true}><GenealogyForm /></ProtectedRoute>} />
            <Route path="/genealogies/:id/detail" element={<ProtectedRoute requireAuth={true}><GenealogyDetail /></ProtectedRoute>} />
            <Route path="/genealogies/:genealogyId/persons/:personId" element={<ProtectedRoute requireAuth={true}><PersonDetail /></ProtectedRoute>} />
            <Route path="/genealogies/:genealogyId/persons/create" element={<ProtectedRoute requireAuth={true}><PersonForm /></ProtectedRoute>} />
            <Route path="/genealogies/:genealogyId/persons/:personId/edit" element={<ProtectedRoute requireAuth={true}><PersonForm /></ProtectedRoute>} />
            <Route path="/genealogies/:genealogyId/relationships/create" element={<ProtectedRoute requireAuth={true}><RelationshipForm /></ProtectedRoute>} />
            <Route path="/persons" element={<ProtectedRoute requireAuth={true}><PersonForm /></ProtectedRoute>} />
            <Route path="/persons/create" element={<ProtectedRoute requireAuth={true}><PersonForm /></ProtectedRoute>} />
            <Route path="/persons/:id/edit" element={<ProtectedRoute requireAuth={true}><PersonForm /></ProtectedRoute>} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-8">个人资料</h1>
                      <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600">个人资料页面正在开发中...</p>
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
