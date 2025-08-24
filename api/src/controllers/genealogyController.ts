import { Request, Response } from 'express'
import { supabaseAdmin as supabase } from '../config/database'
import { AuthenticatedRequest } from '../types/auth'
import { Database } from '../types/database'

// Create new genealogy
export const createGenealogy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, privacy_level } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    if (!name || !name.trim()) {
      res.status(400).json({ message: '族谱名称不能为空' })
      return
    }

    const genealogyInsert: Database['public']['Tables']['genealogies']['Insert'] = {
      name: name.trim(),
      description: description?.trim() || null,
      privacy_level: privacy_level || 'private',
      owner_id: userId
    }

    const { data, error } = await (supabase as any)
      .from('genealogies')
      .insert(genealogyInsert)
      .select()
      .single()

    if (error) {
      console.error('Create genealogy error:', error)
      res.status(500).json({ message: '创建族谱失败' })
      return
    }

    res.status(201).json({
      message: '族谱创建成功',
      genealogy: data
    })
  } catch (error) {
    console.error('Create genealogy error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Get genealogy by ID
export const getGenealogyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    const { data, error } = await supabase
      .from('genealogies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get genealogy error:', error)
      res.status(404).json({ message: '族谱不存在' })
      return
    }

    // Check if user has access (owner or public genealogy)
    if (!data || ((data as any).owner_id !== userId && (data as any).privacy_level !== 'public')) {
      res.status(403).json({ message: '没有权限访问此族谱' })
      return
    }

    res.json({ genealogy: data })
  } catch (error) {
    console.error('Get genealogy error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Update genealogy
export const updateGenealogy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description, privacy_level } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    if (!name || !name.trim()) {
      res.status(400).json({ message: '族谱名称不能为空' })
      return
    }

    // Check if user is the owner
    const { data: existingGenealogy, error: fetchError } = await supabase
      .from('genealogies')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      res.status(404).json({ message: '族谱不存在' })
      return
    }

    if (!existingGenealogy || (existingGenealogy as any).owner_id !== userId) {
      res.status(403).json({ message: '没有权限编辑此族谱' })
      return
    }

    const genealogyUpdate: Database['public']['Tables']['genealogies']['Update'] = {
      name: name.trim(),
      description: description?.trim() || null,
      privacy_level: privacy_level || 'private'
    }

    const { data, error } = await (supabase as any)
      .from('genealogies')
      .update(genealogyUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update genealogy error:', error)
      res.status(500).json({ message: '更新族谱失败' })
      return
    }

    res.json({
      message: '族谱更新成功',
      genealogy: data
    })
  } catch (error) {
    console.error('Update genealogy error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Delete genealogy
export const deleteGenealogy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    // Check if user is the owner
    const { data: existingGenealogy, error: fetchError } = await supabase
      .from('genealogies')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      res.status(404).json({ message: '族谱不存在' })
      return
    }

    if (!existingGenealogy || (existingGenealogy as any).owner_id !== userId) {
      res.status(403).json({ message: '没有权限删除此族谱' })
      return
    }

    // Delete related persons first (cascade delete)
    await supabase
      .from('persons')
      .delete()
      .eq('genealogy_id', id)

    // Delete the genealogy
    const { error } = await supabase
      .from('genealogies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete genealogy error:', error)
      res.status(500).json({ message: '删除族谱失败' })
      return
    }

    res.json({ message: '族谱删除成功' })
  } catch (error) {
    console.error('Delete genealogy error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Get user's genealogies
export const getUserGenealogies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    // Get genealogies where user is creator or genealogy is public
    const { data, error } = await supabase
      .from('genealogies')
      .select(`
        *,
        persons:persons(count)
      `)
      .or(`owner_id.eq.${userId},privacy_level.eq.public`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get user genealogies error:', error)
      res.status(500).json({ message: '获取族谱列表失败' })
      return
    }

    // Transform the data to include person count
    const genealogies = data.map((genealogy: any) => ({
      ...genealogy,
      person_count: genealogy.persons?.[0]?.count || 0,
      persons: undefined // Remove the persons field
    }))

    res.json({ genealogies })
  } catch (error) {
    console.error('Get user genealogies error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Get genealogy persons
export const getGenealogyPersons = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    // Check if user has access to the genealogy
    const { data: genealogy, error: genealogyError } = await supabase
      .from('genealogies')
      .select('owner_id, privacy_level')
      .eq('id', id)
      .single()

    if (genealogyError || !genealogy) {
      res.status(404).json({ message: '族谱不存在' })
      return
    }

    if ((genealogy as any).owner_id !== userId && (genealogy as any).privacy_level !== 'public') {
      res.status(403).json({ message: '没有权限访问此族谱' })
      return
    }

    // Get persons in the genealogy
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('genealogy_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get genealogy persons error:', error)
      res.status(500).json({ message: '获取成员列表失败' })
      return
    }

    res.json({ persons: data })
  } catch (error) {
    console.error('Get genealogy persons error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}