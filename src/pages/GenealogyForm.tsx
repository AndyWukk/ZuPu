import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Save, TreePine } from 'lucide-react'
import { toast } from 'sonner'

interface GenealogyFormData {
  name: string
  description: string
  privacy_level: 'public' | 'private' | 'family' | ''
}

interface Genealogy {
  id: string
  name: string
  description?: string
  privacy_level: 'public' | 'private' | 'family'
  owner_id: string
  created_at: string
}

const PRIVACY_LEVELS = [
  {
    value: 'public',
    label: '公开',
    description: '任何人都可以查看此族谱'
  },
  {
    value: 'family',
    label: '家族',
    description: '只有家族成员可以查看'
  },
  {
    value: 'private',
    label: '私有',
    description: '只有您可以查看和编辑'
  }
]

export const GenealogyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  
  const [formData, setFormData] = useState<GenealogyFormData>({
    name: '',
    description: '',
    privacy_level: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEdit = !!id

  useEffect(() => {
    if (isEdit && id) {
      fetchGenealogyData()
    }
  }, [isEdit, id])

  const fetchGenealogyData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/genealogies/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取族谱信息失败')
      }
      
      const data = await response.json()
      const genealogy: Genealogy = data.genealogy
      
      setFormData({
        name: genealogy.name || '',
        description: genealogy.description || '',
        privacy_level: genealogy.privacy_level || ''
      })
      
    } catch (error) {
      console.error('获取族谱信息失败:', error)
      toast.error('获取族谱信息失败')
      navigate('/genealogies')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof GenealogyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('请输入族谱名称')
      return false
    }
    
    if (formData.name.trim().length < 2) {
      toast.error('族谱名称至少需要2个字符')
      return false
    }
    
    if (formData.name.trim().length > 50) {
      toast.error('族谱名称不能超过50个字符')
      return false
    }
    
    if (!formData.privacy_level) {
      toast.error('请选择隐私级别')
      return false
    }
    
    if (formData.description.length > 500) {
      toast.error('描述不能超过500个字符')
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
      
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        privacy_level: formData.privacy_level
      }
      
      let response
      if (isEdit) {
        response = await fetch(`http://localhost:3001/api/genealogies/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        })
      } else {
        response = await fetch('http://localhost:3001/api/genealogies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '保存失败')
      }
      
      const responseData = await response.json()
      toast.success(isEdit ? '族谱更新成功' : '族谱创建成功')
      
      // 跳转到族谱详情页
      const genealogyId = isEdit ? id : responseData.genealogy.id
      navigate(`/genealogies/${genealogyId}`)
      
    } catch (error) {
      console.error('保存失败:', error)
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
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
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/genealogies')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? '编辑族谱' : '创建族谱'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            族谱信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 族谱名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">族谱名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入族谱名称，如：张氏家族、李家族谱等"
                maxLength={50}
                required
              />
              <p className="text-sm text-gray-500">
                {formData.name.length}/50 字符
              </p>
            </div>

            {/* 隐私级别 */}
            <div className="space-y-2">
              <Label htmlFor="privacy_level">隐私级别 *</Label>
              <Select value={formData.privacy_level} onValueChange={(value) => handleInputChange('privacy_level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择隐私级别" />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 族谱描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">族谱描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请输入族谱描述，如：家族历史、起源地、主要分支等信息..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/500 字符（可选）
              </p>
            </div>

            {/* 隐私级别说明 */}
            {formData.privacy_level && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">隐私级别说明</h4>
                <p className="text-blue-800 text-sm">
                  {PRIVACY_LEVELS.find(level => level.value === formData.privacy_level)?.description}
                </p>
                {formData.privacy_level === 'family' && (
                  <p className="text-blue-700 text-sm mt-2">
                    注意：家族级别需要您手动邀请家族成员加入
                  </p>
                )}
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/genealogies')}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEdit ? '更新' : '创建'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 创建后的下一步提示 */}
      {!isEdit && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>创建后的下一步</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">添加家族成员</p>
                  <p>开始录入家族成员的基本信息</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">建立家庭关系</p>
                  <p>设置成员之间的父子、夫妻、兄弟姐妹关系</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">查看族谱树</p>
                  <p>在族谱树中查看完整的家族关系图</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}