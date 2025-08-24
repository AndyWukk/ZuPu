import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { genealogyAPI } from '../lib/api'
import { ArrowLeft, Save, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface Genealogy {
  id: string
  name: string
  description: string
  is_public: boolean
  creator_id: string
}

export default function GenealogyEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [genealogy, setGenealogy] = useState<Genealogy | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGenealogy(id)
    }
  }, [id])

  const fetchGenealogy = async (genealogyId: string) => {
    try {
      const response = await genealogyAPI.getById(genealogyId)
      const genealogyData = response.genealogy
      
      setGenealogy(genealogyData)
      setFormData({
        name: genealogyData.name,
        description: genealogyData.description || '',
        is_public: genealogyData.is_public
      })
      
      // Check if user is the owner
      const ownerCheck = genealogyData.creator_id === user?.id
      setIsOwner(ownerCheck)
      
      if (!ownerCheck) {
        setError('您没有权限编辑此族谱')
      }
    } catch (err: any) {
      setError(err.message || '获取族谱信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('族谱名称不能为空')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await genealogyAPI.update(id!, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_public: formData.is_public
      })

      navigate(`/genealogies/${id}`)
    } catch (err: any) {
      setError(err.message || '更新族谱失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !genealogy) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <Link to="/genealogies" className="text-red-600 hover:text-red-800 mt-2 inline-block">
              返回族谱列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800">您没有权限编辑此族谱</p>
            <Link to={`/genealogies/${id}`} className="text-yellow-600 hover:text-yellow-800 mt-2 inline-block">
              返回族谱详情
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/genealogies/${id}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回族谱详情
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">编辑族谱</h1>
          <p className="text-gray-600 mt-2">修改族谱的基本信息和设置</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <X className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                族谱名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入族谱名称"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                族谱描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入族谱描述（可选）"
              />
            </div>

            {/* Privacy Setting */}
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                  公开族谱
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                公开的族谱可以被其他用户搜索和查看（只读权限）
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to={`/genealogies/${id}`}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存更改
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}