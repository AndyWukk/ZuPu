import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { personAPI } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, Edit, Trash2, User, Calendar, MapPin, Briefcase, GraduationCap, FileText, Plus, Heart, Users } from 'lucide-react'

interface Person {
  id: string
  name: string
  gender: string
  birth_date: string
  death_date: string
  birth_place: string
  death_place: string
  occupation: string
  education: string
  biography: string
  genealogy_id: string
  created_at: string
  updated_at: string
}

interface Relationship {
  id: string
  person1_id: string
  person2_id: string
  relationship_type: string
  created_at: string
  person1_name?: string
  person2_name?: string
}

interface PersonEvent {
  id: string
  person_id: string
  event_type: string
  event_date: string
  event_place: string
  description: string
  created_at: string
}

export default function PersonDetail() {
  const { genealogyId, personId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [person, setPerson] = useState<Person | null>(null)
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [events, setEvents] = useState<PersonEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    fetchPersonData()
  }, [personId, user])

  const fetchPersonData = async () => {
    if (!personId) return
    
    try {
      setLoading(true)
      
      // Fetch person details
      const response = await personAPI.getById(personId)
      setPerson(response.person)
      setCanEdit(response.person.genealogy.creator_id === user?.id)
      
      // Fetch relationships
      const relationshipsResponse = await personAPI.getRelationships(personId)
      setRelationships(relationshipsResponse.relationships || [])
    } catch (err: any) {
      console.error('Error fetching person data:', err)
      setError(err.message || '获取人员信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个人员吗？此操作不可撤销，同时会删除相关的所有关系。')) {
      return
    }
    
    try {
      await personAPI.delete(personId!)
      navigate(`/genealogies/${person?.genealogy_id}`)
    } catch (err: any) {
      console.error('Error deleting person:', err)
      setError(err.message || '删除人员失败')
    }
  }

  const getRelationshipLabel = (relationship: Relationship) => {
    const isCurrentPerson = relationship.person1_id === personId
    const relatedPersonName = isCurrentPerson ? relationship.person2_name : relationship.person1_name
    
    let label = ''
    switch (relationship.relationship_type) {
      case 'parent':
        label = isCurrentPerson ? '子女' : '父母'
        break
      case 'child':
        label = isCurrentPerson ? '父母' : '子女'
        break
      case 'spouse':
        label = '配偶'
        break
      case 'sibling':
        label = '兄弟姐妹'
        break
      default:
        label = relationship.relationship_type
    }
    
    return { label, name: relatedPersonName }
  }

  const getEventTypeLabel = (eventType: string) => {
    const labels: { [key: string]: string } = {
      birth: '出生',
      death: '去世',
      marriage: '结婚',
      education: '教育',
      career: '职业',
      achievement: '成就',
      other: '其他'
    }
    return labels[eventType] || eventType
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error || '人物不存在'}</p>
            <button
              onClick={() => navigate(-1)}
              className="text-red-600 hover:text-red-800 mt-2 inline-block"
            >
              返回上一页
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/genealogies/${genealogyId}`)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回族谱
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{person.name}</h1>
                <p className="text-gray-600 mt-1">
                  {person.gender === 'male' ? '男' : person.gender === 'female' ? '女' : '未知'}
                </p>
                {person.occupation && (
                  <p className="text-gray-600">{person.occupation}</p>
                )}
              </div>
            </div>
            
            {canEdit && (
              <div className="flex space-x-2">
                <Link
                  to={`/persons/${person.id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {person.birth_date && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">出生日期</p>
                      <p className="text-gray-900">{new Date(person.birth_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {person.death_date && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">去世日期</p>
                      <p className="text-gray-900">{new Date(person.death_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {person.birth_place && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">出生地</p>
                      <p className="text-gray-900">{person.birth_place}</p>
                    </div>
                  </div>
                )}
                {person.death_place && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">去世地</p>
                      <p className="text-gray-900">{person.death_place}</p>
                    </div>
                  </div>
                )}
                {person.education && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">教育背景</p>
                    <p className="text-gray-900">{person.education}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Biography */}
            {person.biography && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">生平简介</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{person.biography}</p>
                </div>
              </div>
            )}

            {/* Life Events */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">生平事件</h2>
                {canEdit && (
                  <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100">
                    <Plus className="h-4 w-4 mr-1" />
                    添加事件
                  </button>
                )}
              </div>
              
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无生平事件记录</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {getEventTypeLabel(event.event_type)}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString()}
                        </span>
                      </div>
                      {event.event_place && (
                        <p className="text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {event.event_place}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-gray-700 mt-2">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Family Relationships */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">家庭关系</h2>
                {canEdit && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    <Plus className="h-4 w-4 inline mr-1" />
                    添加关系
                  </button>
                )}
              </div>
              
              {relationships.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无家庭关系记录</p>
              ) : (
                <div className="space-y-3">
                  {relationships.map((relationship) => {
                    const { label, name } = getRelationshipLabel(relationship)
                    return (
                      <div key={relationship.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">{name}</p>
                          <p className="text-sm text-gray-600">{label}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {relationship.relationship_type === 'spouse' && (
                            <Heart className="h-4 w-4 text-red-500" />
                          )}
                          {(relationship.relationship_type === 'parent' || relationship.relationship_type === 'child') && (
                            <Users className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">统计信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">家庭关系</span>
                  <span className="font-medium">{relationships.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">生平事件</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">创建时间</span>
                  <span className="font-medium text-sm">
                    {new Date(person.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}