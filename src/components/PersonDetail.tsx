import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Edit, Calendar, MapPin, Users, Heart, Baby } from 'lucide-react'
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
}

interface Relationship {
  id: string
  person1_id: string
  person2_id: string
  relationship_type: 'parent' | 'spouse' | 'sibling'
  person1?: Person
  person2?: Person
}

interface PersonDetailProps {
  person: Person
  relationships: Relationship[]
  onEdit?: () => void
  onPersonClick?: (person: Person) => void
}

export const PersonDetail: React.FC<PersonDetailProps> = ({
  person,
  relationships,
  onEdit,
  onPersonClick
}) => {
  const { user } = useAuthStore()
  const [canEdit, setCanEdit] = useState(false)

  useEffect(() => {
    // 检查用户是否有编辑权限（这里简化处理，实际应该检查族谱权限）
    setCanEdit(!!user)
  }, [user])

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getAge = () => {
    if (!person.birth_date) return null
    const birth = new Date(person.birth_date)
    const end = person.death_date ? new Date(person.death_date) : new Date()
    const age = end.getFullYear() - birth.getFullYear()
    return age
  }

  const getRelationshipsByType = (type: string) => {
    return relationships.filter(r => r.relationship_type === type)
  }

  const getRelatedPersons = (relationshipType: string) => {
    const relations = getRelationshipsByType(relationshipType)
    return relations.map(r => {
      if (r.person1_id === person.id) {
        return r.person2
      } else {
        return r.person1
      }
    }).filter(Boolean) as Person[]
  }

  const parents = getRelatedPersons('parent').filter(p => 
    relationships.some(r => r.relationship_type === 'parent' && r.person1_id === p.id && r.person2_id === person.id)
  )
  
  const children = getRelatedPersons('parent').filter(p => 
    relationships.some(r => r.relationship_type === 'parent' && r.person1_id === person.id && r.person2_id === p.id)
  )
  
  const spouses = getRelatedPersons('spouse')
  const siblings = getRelatedPersons('sibling')

  const PersonCard: React.FC<{ person: Person; relationship: string }> = ({ person: relatedPerson, relationship }) => (
    <div 
      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onPersonClick?.(relatedPerson)}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={relatedPerson.photo_url} />
        <AvatarFallback>
          {relatedPerson.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-medium">{relatedPerson.name}</div>
        <div className="text-sm text-gray-500">{relationship}</div>
      </div>
      <Badge variant={relatedPerson.gender === 'male' ? 'default' : 'secondary'}>
        {relatedPerson.gender === 'male' ? '男' : '女'}
      </Badge>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src={person.photo_url} />
                <AvatarFallback className="text-xl">
                  {person.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{person.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={person.gender === 'male' ? 'default' : 'secondary'}>
                    {person.gender === 'male' ? '男' : '女'}
                  </Badge>
                  {getAge() && (
                    <Badge variant="outline">
                      {person.death_date ? `享年 ${getAge()}岁` : `${getAge()}岁`}
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
            {canEdit && onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 生卒信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">出生：</span>
              <span>{formatDate(person.birth_date)}</span>
              {person.birth_place && (
                <>
                  <MapPin className="h-4 w-4 text-gray-500 ml-2" />
                  <span className="text-sm">{person.birth_place}</span>
                </>
              )}
            </div>
            {person.death_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">逝世：</span>
                <span>{formatDate(person.death_date)}</span>
                {person.death_place && (
                  <>
                    <MapPin className="h-4 w-4 text-gray-500 ml-2" />
                    <span className="text-sm">{person.death_place}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 个人简介 */}
          {person.biography && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">个人简介</h3>
                <p className="text-gray-700 leading-relaxed">{person.biography}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 家庭关系 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            家庭关系
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 父母 */}
          {parents.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                父母
              </h3>
              <div className="space-y-2">
                {parents.map(parent => (
                  <PersonCard key={parent.id} person={parent} relationship="父/母" />
                ))}
              </div>
            </div>
          )}

          {/* 配偶 */}
          {spouses.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                配偶
              </h3>
              <div className="space-y-2">
                {spouses.map(spouse => (
                  <PersonCard key={spouse.id} person={spouse} relationship="配偶" />
                ))}
              </div>
            </div>
          )}

          {/* 子女 */}
          {children.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Baby className="h-4 w-4" />
                子女
              </h3>
              <div className="space-y-2">
                {children.map(child => (
                  <PersonCard key={child.id} person={child} relationship="子/女" />
                ))}
              </div>
            </div>
          )}

          {/* 兄弟姐妹 */}
          {siblings.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                兄弟姐妹
              </h3>
              <div className="space-y-2">
                {siblings.map(sibling => (
                  <PersonCard key={sibling.id} person={sibling} relationship="兄弟/姐妹" />
                ))}
              </div>
            </div>
          )}

          {parents.length === 0 && spouses.length === 0 && children.length === 0 && siblings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无家庭关系信息
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}