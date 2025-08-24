import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Search, TreePine, Edit } from 'lucide-react'
import { GenealogyTree } from '@/components/GenealogyTree'
import { SearchFilter } from '@/components/SearchFilter'
import { PersonDetail } from '@/components/PersonDetail'
import { useAuthStore } from '@/store/authStore'

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
  generation?: number
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
  created_by: string
  created_at: string
  updated_at: string
  is_public: boolean
}

export const GenealogyTreeView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [genealogy, setGenealogy] = useState<Genealogy | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tree')

  // 模拟数据加载
  useEffect(() => {
    const loadGenealogyData = async () => {
      try {
        setLoading(true)
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟族谱数据
        const mockGenealogy: Genealogy = {
          id: id || '1',
          name: '张氏家族族谱',
          description: '张氏家族世代传承，源远流长',
          created_by: user?.id || '1',
          created_at: '2024-01-01',
          updated_at: '2024-01-15',
          is_public: true
        }
        
        // 模拟人物数据
        const mockPersons: Person[] = [
          {
            id: '1',
            name: '张三',
            gender: 'male',
            birth_date: '1950-01-01',
            birth_place: '北京市',
            genealogy_id: id || '1',
            generation: 1,
            biography: '家族长者，德高望重'
          },
          {
            id: '2',
            name: '李四',
            gender: 'female',
            birth_date: '1955-03-15',
            birth_place: '上海市',
            genealogy_id: id || '1',
            generation: 1
          },
          {
            id: '3',
            name: '张小明',
            gender: 'male',
            birth_date: '1980-06-20',
            birth_place: '广州市',
            genealogy_id: id || '1',
            generation: 2
          },
          {
            id: '4',
            name: '张小红',
            gender: 'female',
            birth_date: '1985-09-10',
            birth_place: '深圳市',
            genealogy_id: id || '1',
            generation: 2
          },
          {
            id: '5',
            name: '张小宝',
            gender: 'male',
            birth_date: '2010-12-25',
            birth_place: '杭州市',
            genealogy_id: id || '1',
            generation: 3
          }
        ]
        
        // 模拟关系数据
        const mockRelationships: Relationship[] = [
          {
            id: '1',
            person1_id: '1',
            person2_id: '2',
            relationship_type: 'spouse'
          },
          {
            id: '2',
            person1_id: '1',
            person2_id: '3',
            relationship_type: 'parent'
          },
          {
            id: '3',
            person1_id: '2',
            person2_id: '3',
            relationship_type: 'parent'
          },
          {
            id: '4',
            person1_id: '3',
            person2_id: '4',
            relationship_type: 'sibling'
          },
          {
            id: '5',
            person1_id: '3',
            person2_id: '5',
            relationship_type: 'parent'
          }
        ]
        
        setGenealogy(mockGenealogy)
        setPersons(mockPersons)
        setRelationships(mockRelationships)
        setFilteredPersons(mockPersons)
        
      } catch (err) {
        setError('加载族谱数据失败')
        console.error('Error loading genealogy data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadGenealogyData()
    }
  }, [id, user])

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person)
    setActiveTab('detail')
  }

  const handlePersonEdit = () => {
    if (selectedPerson) {
      navigate(`/genealogies/${id}/persons/${selectedPerson.id}/edit`)
    }
  }

  const handleFilterChange = (filtered: Person[]) => {
    setFilteredPersons(filtered)
  }

  const getPersonRelationships = (personId: string) => {
    return relationships.filter(r => 
      r.person1_id === personId || r.person2_id === personId
    ).map(r => {
      // 添加关联的人物信息
      const relatedPersonId = r.person1_id === personId ? r.person2_id : r.person1_id
      const relatedPerson = persons.find(p => p.id === relatedPersonId)
      return {
        ...r,
        person1: persons.find(p => p.id === r.person1_id),
        person2: persons.find(p => p.id === r.person2_id)
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载族谱数据中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/genealogies')}>返回族谱列表</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!genealogy) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">族谱不存在</p>
            <Button onClick={() => navigate('/genealogies')}>返回族谱列表</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/genealogies')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{genealogy.name}</h1>
              {genealogy.description && (
                <p className="text-gray-600 mt-1">{genealogy.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={genealogy.is_public ? 'default' : 'secondary'}>
                {genealogy.is_public ? '公开' : '私有'}
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {persons.length} 人
              </Badge>
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              族谱树
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              搜索
            </TabsTrigger>
            <TabsTrigger value="detail" className="flex items-center gap-2" disabled={!selectedPerson}>
              <Users className="h-4 w-4" />
              人物详情
            </TabsTrigger>
          </TabsList>

          {/* 族谱树视图 */}
          <TabsContent value="tree" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  家族树状图
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border rounded-lg">
                  <GenealogyTree 
                    persons={persons}
                    relationships={relationships}
                    onPersonClick={handlePersonSelect}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 搜索视图 */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  人物搜索
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SearchFilter 
                  persons={persons}
                  onPersonSelect={handlePersonSelect}
                  onFilterChange={handleFilterChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 人物详情视图 */}
          <TabsContent value="detail" className="space-y-6">
            {selectedPerson ? (
              <PersonDetail 
                person={selectedPerson}
                relationships={getPersonRelationships(selectedPerson.id)}
                onEdit={handlePersonEdit}
                onPersonClick={handlePersonSelect}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">请先选择一个人物查看详情</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}