import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GenealogyTree } from '@/components/GenealogyTree'
import { PersonDetail } from '@/components/PersonDetail'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Search, Users, TreePine, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Person {
  id: string
  name: string
  gender?: 'male' | 'female'
  birth_date?: string
  death_date?: string
  birth_place?: string
  death_place?: string
  photo_url?: string
  biography?: string
  genealogy_id: string
}

interface Relationship {
  id: string
  person1_id: string
  person2_id: string
  relationship_type: 'parent' | 'spouse' | 'sibling'
  person1?: Person
  person2?: Person
}

interface Genealogy {
  id: string
  name: string
  description?: string
  privacy_level: 'public' | 'private' | 'family'
  owner_id: string
  created_at: string
}

export const GenealogyView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  
  const [genealogy, setGenealogy] = useState<Genealogy | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tree')

  useEffect(() => {
    if (id) {
      fetchGenealogyData()
    }
  }, [id])

  const fetchGenealogyData = async () => {
    try {
      setLoading(true)
      
      // 获取族谱信息
      const genealogyResponse = await fetch(`http://localhost:3001/api/genealogies/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!genealogyResponse.ok) {
        throw new Error('获取族谱信息失败')
      }
      
      const genealogyData = await genealogyResponse.json()
      setGenealogy(genealogyData.genealogy)
      
      // 获取族谱成员
      const personsResponse = await fetch(`http://localhost:3001/api/genealogies/${id}/persons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!personsResponse.ok) {
        throw new Error('获取成员列表失败')
      }
      
      const personsData = await personsResponse.json()
      setPersons(personsData.persons || [])
      
      // 获取所有关系
      const allRelationships: Relationship[] = []
      for (const person of personsData.persons || []) {
        try {
          const relationshipsResponse = await fetch(`http://localhost:3001/api/persons/${person.id}/relationships`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (relationshipsResponse.ok) {
            const relationshipsData = await relationshipsResponse.json()
            allRelationships.push(...(relationshipsData.relationships || []))
          }
        } catch (error) {
          console.error(`获取人员 ${person.id} 的关系失败:`, error)
        }
      }
      
      // 去重关系
      const uniqueRelationships = allRelationships.filter((rel, index, self) => 
        index === self.findIndex(r => r.id === rel.id)
      )
      
      setRelationships(uniqueRelationships)
      
    } catch (error) {
      console.error('获取族谱数据失败:', error)
      toast.error('获取族谱数据失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredPersons = persons.filter(person => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person)
    setActiveTab('detail')
  }

  const handleEditPerson = () => {
    if (selectedPerson) {
      navigate(`/persons/${selectedPerson.id}/edit`)
    }
  }

  const handleAddPerson = () => {
    navigate(`/genealogies/${id}/persons/new`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载族谱数据中...</p>
        </div>
      </div>
    )
  }

  if (!genealogy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">族谱不存在或无权访问</p>
          <Button onClick={() => navigate('/genealogies')}>
            返回族谱列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/genealogies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{genealogy.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={genealogy.privacy_level === 'public' ? 'default' : 'secondary'}>
                {genealogy.privacy_level === 'public' ? '公开' : genealogy.privacy_level === 'family' ? '家族' : '私有'}
              </Badge>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{persons.length} 位成员</span>
            </div>
            {genealogy.description && (
              <p className="text-gray-600 mt-2">{genealogy.description}</p>
            )}
          </div>
        </div>
        <Button onClick={handleAddPerson}>
          <Plus className="h-4 w-4 mr-2" />
          添加成员
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索族谱成员..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tree" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            族谱树
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            成员列表
          </TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedPerson}>
            人物详情
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-6">
          <GenealogyTree
            persons={filteredPersons}
            relationships={relationships}
            onPersonClick={handlePersonClick}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>成员列表</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPersons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPersons.map(person => (
                    <div
                      key={person.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handlePersonClick(person)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {person.photo_url ? (
                            <img
                              src={person.photo_url}
                              alt={person.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold">
                              {person.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{person.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={person.gender === 'male' ? 'default' : 'secondary'}>
                              {person.gender === 'male' ? '男' : '女'}
                            </Badge>
                            {person.birth_date && (
                              <span className="text-sm text-gray-500">
                                {new Date(person.birth_date).getFullYear()}年生
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? '未找到匹配的成员' : '暂无成员数据'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          {selectedPerson ? (
            <PersonDetail
              person={selectedPerson}
              relationships={relationships.filter(r => 
                r.person1_id === selectedPerson.id || r.person2_id === selectedPerson.id
              )}
              onEdit={handleEditPerson}
              onPersonClick={handlePersonClick}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  请先选择一个人物查看详情
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}