import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface PersonFormData {
  name: string
  gender: 'male' | 'female' | ''
  birth_date: string
  death_date: string
  birth_place: string
  death_place: string
  photo_url: string
  biography: string
}

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

export const PersonForm: React.FC = () => {
  const { genealogyId, personId } = useParams<{ genealogyId: string; personId?: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()
  
  const [formData, setFormData] = useState<PersonFormData>({
    name: '',
    gender: '',
    birth_date: '',
    death_date: '',
    birth_place: '',
    death_place: '',
    photo_url: '',
    biography: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isEdit = !!personId

  useEffect(() => {
    if (isEdit && personId) {
      fetchPersonData()
    }
  }, [isEdit, personId])

  const fetchPersonData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/persons/${personId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('获取人物信息失败')
      }
      
      const data = await response.json()
      const person: Person = data.person
      
      setFormData({
        name: person.name || '',
        gender: person.gender || '',
        birth_date: person.birth_date ? person.birth_date.split('T')[0] : '',
        death_date: person.death_date ? person.death_date.split('T')[0] : '',
        birth_place: person.birth_place || '',
        death_place: person.death_place || '',
        photo_url: person.photo_url || '',
        biography: person.biography || ''
      })
      
    } catch (error) {
      console.error('获取人物信息失败:', error)
      toast.error('获取人物信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof PersonFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('http://localhost:3001/api/upload/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      handleInputChange('photo_url', data.url)
      toast.success('照片上传成功')
      
    } catch (error) {
      console.error('上传照片失败:', error)
      toast.error('上传照片失败')
    } finally {
      setUploading(false)
    }
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('请输入姓名')
      return false
    }
    
    if (!formData.gender) {
      toast.error('请选择性别')
      return false
    }
    
    // 验证日期格式
    if (formData.birth_date && isNaN(Date.parse(formData.birth_date))) {
      toast.error('出生日期格式不正确')
      return false
    }
    
    if (formData.death_date && isNaN(Date.parse(formData.death_date))) {
      toast.error('去世日期格式不正确')
      return false
    }
    
    // 验证日期逻辑
    if (formData.birth_date && formData.death_date) {
      const birthDate = new Date(formData.birth_date)
      const deathDate = new Date(formData.death_date)
      if (birthDate >= deathDate) {
        toast.error('去世日期必须晚于出生日期')
        return false
      }
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
        ...formData,
        birth_date: formData.birth_date || null,
        death_date: formData.death_date || null,
        birth_place: formData.birth_place || null,
        death_place: formData.death_place || null,
        photo_url: formData.photo_url || null,
        biography: formData.biography || null
      }
      
      let response
      if (isEdit) {
        response = await fetch(`http://localhost:3001/api/persons/${personId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        })
      } else {
        response = await fetch('http://localhost:3001/api/persons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...submitData,
            genealogy_id: genealogyId
          })
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '保存失败')
      }
      
      toast.success(isEdit ? '更新成功' : '创建成功')
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
        <Button variant="ghost" onClick={() => navigate(`/genealogies/${genealogyId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? '编辑人物信息' : '添加新成员'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入姓名"
                required
              />
            </div>

            {/* 性别 */}
            <div className="space-y-2">
              <Label htmlFor="gender">性别 *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择性别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="female">女</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 出生信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">出生日期</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_place">出生地</Label>
                <Input
                  id="birth_place"
                  value={formData.birth_place}
                  onChange={(e) => handleInputChange('birth_place', e.target.value)}
                  placeholder="请输入出生地"
                />
              </div>
            </div>

            {/* 去世信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="death_date">去世日期</Label>
                <Input
                  id="death_date"
                  type="date"
                  value={formData.death_date}
                  onChange={(e) => handleInputChange('death_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="death_place">去世地</Label>
                <Input
                  id="death_place"
                  value={formData.death_place}
                  onChange={(e) => handleInputChange('death_place', e.target.value)}
                  placeholder="请输入去世地"
                />
              </div>
            </div>

            {/* 照片上传 */}
            <div className="space-y-2">
              <Label htmlFor="photo">照片</Label>
              <div className="flex items-center gap-4">
                {formData.photo_url && (
                  <img
                    src={formData.photo_url}
                    alt="预览"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    支持 JPG、PNG 格式，文件大小不超过 5MB
                  </p>
                </div>
                {uploading && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">上传中...</span>
                  </div>
                )}
              </div>
            </div>

            {/* 个人简介 */}
            <div className="space-y-2">
              <Label htmlFor="biography">个人简介</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) => handleInputChange('biography', e.target.value)}
                placeholder="请输入个人简介、生平事迹等信息..."
                rows={4}
              />
            </div>

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
    </div>
  )
}