import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { genealogyAPI, personAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, Edit, Plus, Search, Trash2, User, Users, Calendar, MapPin, Eye } from 'lucide-react'

interface Genealogy {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  creator_id: string
  is_public: boolean
}

interface Person {
  id: string
  name: string
  gender: string
  birth_date: string
  death_date: string
  birth_place: string
  occupation: string
  created_at: string
}

export default function GenealogyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [genealogy, setGenealogy] = useState<Genealogy | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchGenealogyData()
  }, [id])

  useEffect(() => {
    if (searchTerm) {
      setFilteredPersons(
        persons.filter(person => 
          person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.birth_place?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredPersons(persons)
    }
  }, [searchTerm, persons])

  const fetchGenealogyData = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Fetch genealogy details
      const genealogyResponse = await genealogyAPI.getById(id)
      setGenealogy(genealogyResponse.genealogy)
      
      // Fetch persons in this genealogy
      const personsResponse = await genealogyAPI.getPersons(id)
      setPersons(personsResponse.persons || [])
      setFilteredPersons(personsResponse.persons || [])
    } catch (err: any) {
      console.error('Error fetching genealogy data:', err)
      setError(err.message || '获取族谱信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePerson = async (personId: string) => {
    if (!window.confirm('确定要删除这个人员吗？此操作不可撤销。')) {
      return
    }
    
    try {
      await personAPI.delete(personId)
      
      // Refresh the persons list
      setPersons(persons.filter(p => p.id !== personId))
      setFilteredPersons(filteredPersons.filter(p => p.id !== personId))
    } catch (err: any) {
      console.error('Error deleting person:', err)
      setError(err.message || '删除人员失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !genealogy) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error || '族谱不存在'}</p>
            <Link to="/genealogies" className="text-red-600 hover:text-red-800 mt-2 inline-block">
              返回族谱列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/genealogies')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回族谱列表
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{genealogy.name}</h1>
              <p className="text-gray-600 mt-2">{genealogy.description || '暂无描述'}</p>
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>创建于 {new Date(genealogy.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{persons.length} 位成员</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  genealogy.is_public 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {genealogy.is_public ? '公开' : '私有'}
                </span>
              </div>
            </div>
            
            {isOwner && (
              <div className="flex space-x-2">
                <Link
                  to={`/genealogies/${id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </Link>
                <Link
                  to={`/genealogies/${id}/tree`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  族谱图
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">家族成员</h2>
              {isOwner && (
                <Link
                  to={`/persons/create?genealogy_id=${id}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加成员
                </Link>
              )}
            </div>
            
            {/* Search */}
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索成员姓名、职业、出生地..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="p-6">
            {filteredPersons.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '没有找到匹配的成员' : '还没有家族成员'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? '尝试使用其他关键词搜索' : '添加第一位家族成员，开始构建族谱'}
                </p>
                {!searchTerm && isOwner && (
                  <Link
                    to={`/persons/create?genealogy_id=${id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加成员
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPersons.map((person) => (
                  <div key={person.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                        <p className="text-sm text-gray-500">
                          {person.gender === 'male' ? '男' : person.gender === 'female' ? '女' : '未知'}
                        </p>
                      </div>
                      {isOwner && (
                        <div className="flex space-x-1">
                          <Link
                            to={`/persons/${person.id}/edit`}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="编辑"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeletePerson(person.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {person.birth_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>生于 {new Date(person.birth_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {person.birth_place && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{person.birth_place}</span>
                        </div>
                      )}
                      {person.occupation && (
                        <div>
                          <span className="font-medium">职业：</span>
                          <span>{person.occupation}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <Link
                        to={`/genealogies/${id}/persons/${person.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        查看详情 →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}