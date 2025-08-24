import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Users, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Person {
  id: string
  name: string
  gender?: 'male' | 'female'
  birth_date?: string
  death_date?: string
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

interface RelationshipFormData {
  person1_id: string
  person2_id: string
  relationship_type: 'parent' | 'spouse' | 'sibling' | ''
}

const RELATIONSHIP_TYPES = [
  { value: 'parent', label: '父子/父女关系', description: '第一个人是第二个人的父/母' },
  { value: 'spouse', label: '夫妻关系', description: '两人为配偶关系' },
  { value: 'sibling', label: '兄弟姐妹关系', description: '两人为兄弟姐妹关系' }
]

export const RelationshipForm: React.FC = () => {
  const { genealogyId, personId } = useParams<{ genealogyId: string; personId?: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  
  const [persons, setPersons] = useState<Person[]>([])
  const [existingRelationships, setExistingRelationships] = useState<Relationship[]>([])
  const [formData, setFormData] = useState<RelationshipFormData>({
    person1_id: personId || '',
    person2_id: '',
    relationship_type: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (genealogyId) {
      fetchData()
    }
  }, [genealogyId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取族谱成员
      const personsResponse = await fetch(`http://localhost:3001/api/genealogies/${genealogyId}/persons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!personsResponse.ok) {
        throw new Error('获取成员列表失败')
      }
      
      const personsData = await personsResponse.json()
      setPersons(personsData.persons || [])
      
      // 获取现有关系
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
      
      setExistingRelationships(uniqueRelationships)
      
    } catch (error) {
      console.error('获取数据失败:', error)
      toast.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof RelationshipFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.person1_id) {
      toast.error('请选择第一个人')
      return false
    }
    
    if (!formData.person2_id) {
      toast.error('请选择第二个人')
      return false
    }
    
    if (formData.person1_id === formData.person2_id) {
      toast.error('不能选择同一个人')
      return false
    }
    
    if (!formData.relationship_type) {
      toast.error('请选择关系类型')
      return false
    }
    
    // 检查是否已存在相同关系
    const existingRelation = existingRelationships.find(rel => 
      (rel.person1_id === formData.person1_id && rel.person2_id === formData.person2_id) ||
      (rel.person1_id === formData.person2_id && rel.person2_id === formData.person1_id)
    )
    
    if (existingRelation) {
      toast.error('这两个人之间已存在关系')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSaving(true)
      
      const response = await fetch('http://localhost:3001/api/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '创建关系失败')
      }
      
      toast.success('关系创建成功')
      navigate(`/genealogies/${genealogyId}`)
      
    } catch (error) {
      console.error('创建关系失败:', error)
      toast.error(error instanceof Error ? error.message : '创建关系失败')
    } finally {
      setSaving(false)
    }
  }

  const getPersonDisplayName = (person: Person) => {
    let displayName = person.name
    if (person.gender) {
      displayName += ` (${person.gender === 'male' ? '男' : '女'})`
    }
    if (person.birth_date) {
      displayName += ` - ${new Date(person.birth_date).getFullYear()}年生`
    }
    return displayName
  }

  const getExistingRelationships = (personId: string) => {
    return existingRelationships.filter(rel => 
      rel.person1_id === personId || rel.person2_id === personId
    )
  }

  const getRelationshipDescription = (rel: Relationship, currentPersonId: string) => {
    const otherPersonId = rel.person1_id === currentPersonId ? rel.person2_id : rel.person1_id
    const otherPerson = persons.find(p => p.id === otherPersonId)
    
    if (!otherPerson) return ''
    
    let relationText = ''
    if (rel.relationship_type === 'parent') {
      relationText = rel.person1_id === currentPersonId ? '的子女' : '的父母'
    } else if (rel.relationship_type === 'spouse') {
      relationText = '的配偶'
    } else if (rel.relationship_type === 'sibling') {
      relationText = '的兄弟姐妹'
    }
    
    return `${otherPerson.name}${relationText}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(`/genealogies/${genealogyId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">建立家庭关系</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 关系表单 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                关系信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 第一个人 */}
                <div className="space-y-2">
                  <Label htmlFor="person1">第一个人 *</Label>
                  <Select value={formData.person1_id} onValueChange={(value) => handleInputChange('person1_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择第一个人" />
                    </SelectTrigger>
                    <SelectContent>
                      {persons.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {getPersonDisplayName(person)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.person1_id && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">现有关系：</p>
                      <div className="flex flex-wrap gap-2">
                        {getExistingRelationships(formData.person1_id).map(rel => (
                          <Badge key={rel.id} variant="secondary" className="text-xs">
                            {getRelationshipDescription(rel, formData.person1_id)}
                          </Badge>
                        ))}
                        {getExistingRelationships(formData.person1_id).length === 0 && (
                          <span className="text-sm text-gray-400">暂无关系</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 关系类型 */}
                <div className="space-y-2">
                  <Label htmlFor="relationship_type">关系类型 *</Label>
                  <Select value={formData.relationship_type} onValueChange={(value) => handleInputChange('relationship_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择关系类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 第二个人 */}
                <div className="space-y-2">
                  <Label htmlFor="person2">第二个人 *</Label>
                  <Select value={formData.person2_id} onValueChange={(value) => handleInputChange('person2_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择第二个人" />
                    </SelectTrigger>
                    <SelectContent>
                      {persons
                        .filter(person => person.id !== formData.person1_id)
                        .map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {getPersonDisplayName(person)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formData.person2_id && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">现有关系：</p>
                      <div className="flex flex-wrap gap-2">
                        {getExistingRelationships(formData.person2_id).map(rel => (
                          <Badge key={rel.id} variant="secondary" className="text-xs">
                            {getRelationshipDescription(rel, formData.person2_id)}
                          </Badge>
                        ))}
                        {getExistingRelationships(formData.person2_id).length === 0 && (
                          <span className="text-sm text-gray-400">暂无关系</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 关系预览 */}
                {formData.person1_id && formData.person2_id && formData.relationship_type && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">关系预览</h4>
                    <p className="text-blue-800">
                      {persons.find(p => p.id === formData.person1_id)?.name} 和{' '}
                      {persons.find(p => p.id === formData.person2_id)?.name} 将建立{' '}
                      <strong>
                        {RELATIONSHIP_TYPES.find(t => t.value === formData.relationship_type)?.label}
                      </strong>
                    </p>
                  </div>
                )}

                {/* 提交按钮 */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/genealogies/${genealogyId}`)}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        创建中...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        创建关系
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 帮助信息 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>关系类型说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {RELATIONSHIP_TYPES.map(type => (
                <div key={type.value} className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">{type.label}</h4>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>注意事项</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 每两个人之间只能建立一种关系</li>
                <li>• 父子关系中，第一个人为父/母，第二个人为子/女</li>
                <li>• 夫妻关系和兄弟姐妹关系没有顺序要求</li>
                <li>• 建立关系后可以在族谱树中查看</li>
                <li>• 如需修改关系，请先删除现有关系再重新建立</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}