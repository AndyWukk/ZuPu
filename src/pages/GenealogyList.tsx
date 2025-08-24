import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/authStore'
import { Plus, Search, TreePine, Users, Calendar, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Genealogy {
  id: string
  name: string
  description?: string
  privacy_level: 'public' | 'private' | 'family'
  owner_id: string
  created_at: string
  updated_at: string
  member_count?: number
  owner_name?: string
}

interface GenealogyPermission {
  id: string
  genealogy_id: string
  user_id: string
  permission_level: 'owner' | 'editor' | 'viewer'
  granted_at: string
}

export const GenealogyList: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  
  const [genealogies, setGenealogies] = useState<Genealogy[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGenealogy, setSelectedGenealogy] = useState<Genealogy | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchGenealogies()
  }, [])

  const fetchGenealogies = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/genealogies/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取族谱列表失败')
      }
      
      const data = await response.json()
      
      // 为每个族谱获取成员数量
      const genealogiesWithCount = await Promise.all(
        (data.genealogies || []).map(async (genealogy: Genealogy) => {
          try {
            const personsResponse = await fetch(`http://localhost:3001/api/genealogies/${genealogy.id}/persons`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (personsResponse.ok) {
              const personsData = await personsResponse.json()
              return {
                ...genealogy,
                member_count: personsData.persons?.length || 0
              }
            }
            
            return { ...genealogy, member_count: 0 }
          } catch (error) {
            console.error(`获取族谱 ${genealogy.id} 成员数量失败:`, error)
            return { ...genealogy, member_count: 0 }
          }
        })
      )
      
      setGenealogies(genealogiesWithCount)
      
    } catch (error) {
      console.error('获取族谱列表失败:', error)
      toast.error('获取族谱列表失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredGenealogies = genealogies.filter(genealogy => 
    genealogy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (genealogy.description && genealogy.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateGenealogy = () => {
    navigate('/genealogies/new')
  }

  const handleViewGenealogy = (genealogy: Genealogy) => {
    navigate(`/genealogies/${genealogy.id}`)
  }

  const handleEditGenealogy = (genealogy: Genealogy) => {
    navigate(`/genealogies/${genealogy.id}/edit`)
  }

  const handleDeleteGenealogy = async () => {
    if (!selectedGenealogy) return
    
    try {
      setDeleting(true)
      const response = await fetch(`http://localhost:3001/api/genealogies/${selectedGenealogy.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '删除失败')
      }
      
      toast.success('族谱删除成功')
      setGenealogies(prev => prev.filter(g => g.id !== selectedGenealogy.id))
      setDeleteDialogOpen(false)
      setSelectedGenealogy(null)
      
    } catch (error) {
      console.error('删除族谱失败:', error)
      toast.error(error instanceof Error ? error.message : '删除族谱失败')
    } finally {
      setDeleting(false)
    }
  }

  const getPrivacyBadge = (privacyLevel: string) => {
    switch (privacyLevel) {
      case 'public':
        return <Badge variant="default">公开</Badge>
      case 'family':
        return <Badge variant="secondary">家族</Badge>
      case 'private':
        return <Badge variant="outline">私有</Badge>
      default:
        return <Badge variant="outline">{privacyLevel}</Badge>
    }
  }

  const canEdit = (genealogy: Genealogy) => {
    return genealogy.owner_id === user?.id
  }

  const canDelete = (genealogy: Genealogy) => {
    return genealogy.owner_id === user?.id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载族谱列表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的族谱</h1>
          <p className="text-gray-600 mt-1">管理和查看您的家族族谱</p>
        </div>
        <Button onClick={handleCreateGenealogy}>
          <Plus className="h-4 w-4 mr-2" />
          创建族谱
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索族谱名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 族谱列表 */}
      {filteredGenealogies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGenealogies.map(genealogy => (
            <Card key={genealogy.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{genealogy.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      {getPrivacyBadge(genealogy.privacy_level)}
                      {genealogy.owner_id === user?.id && (
                        <Badge variant="outline" className="text-xs">我创建的</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewGenealogy(genealogy)}>
                        <Eye className="h-4 w-4 mr-2" />
                        查看
                      </DropdownMenuItem>
                      {canEdit(genealogy) && (
                        <DropdownMenuItem onClick={() => handleEditGenealogy(genealogy)}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                      )}
                      {canDelete(genealogy) && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedGenealogy(genealogy)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent onClick={() => handleViewGenealogy(genealogy)}>
                {genealogy.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {genealogy.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{genealogy.member_count || 0} 位成员</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(genealogy.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TreePine className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? '未找到匹配的族谱' : '还没有族谱'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? '尝试使用不同的关键词搜索' 
                  : '创建您的第一个家族族谱，开始记录家族历史'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateGenealogy}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建族谱
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除族谱</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              您确定要删除族谱 <strong>{selectedGenealogy?.name}</strong> 吗？
            </p>
            <p className="text-sm text-red-600">
              此操作将永久删除族谱及其所有成员信息和关系数据，且无法恢复。
            </p>
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setSelectedGenealogy(null)
                }}
              >
                取消
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteGenealogy}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}