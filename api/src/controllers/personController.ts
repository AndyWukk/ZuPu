import { Request, Response } from 'express'
import { supabaseAdmin as supabase } from '../config/database'
import { AuthenticatedRequest } from '../types/auth'
import { Database } from '../types/database'

// Create new person
export const createPerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      genealogy_id,
      name,
      gender,
      birth_date,
      death_date,
      birth_place,
      death_place,
      occupation,
      education,
      biography
    } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    if (!genealogy_id || !name) {
      res.status(400).json({ message: '族谱ID和姓名不能为空' })
      return
    }

    // Check if user has permission to add person to this genealogy
    const { data: genealogy, error: genealogyError } = await supabase
      .from('genealogies')
      .select('owner_id')
      .eq('id', genealogy_id)
      .single()

    if (genealogyError || !genealogy) {
      res.status(404).json({ message: '族谱不存在' })
      return
    }

    if ((genealogy as any).owner_id !== userId) {
      res.status(403).json({ message: '没有权限在此族谱中创建人员' })
      return
    }

    const personInsert: Database['public']['Tables']['persons']['Insert'] = {
      genealogy_id,
      name: name.trim(),
      gender: gender || 'unknown',
      birth_date: birth_date || null,
      death_date: death_date || null,
      birth_place: birth_place?.trim() || null,
      death_place: death_place?.trim() || null,
      occupation: occupation?.trim() || null,
      biography: biography?.trim() || null,
      photo_url: req.body.photo_url || null,
      generation: req.body.generation || null
    }

    const { data: person, error } = await (supabase as any)
      .from('persons')
      .insert(personInsert)
      .select()
      .single()

    if (error) {
      console.error('Create person error:', error)
      res.status(500).json({ message: '创建人员失败' })
      return
    }

    res.status(201).json({
      message: '人员创建成功',
      person: person
    })
  } catch (error) {
    console.error('Create person error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Get person by ID
export const getPersonById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    const { data, error } = await supabase
      .from('persons')
      .select(`
      *,
      genealogy:genealogies(id, name, owner_id, privacy_level)
    `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get person error:', error)
      res.status(404).json({ message: '人员不存在' })
      return
    }

    // Check if user has access
    if (!data || ((data as any).genealogy.owner_id !== userId && (data as any).genealogy.privacy_level !== 'public')) {
      res.status(403).json({ message: '没有权限访问此人员信息' })
      return
    }

    res.json({ person: data })
  } catch (error) {
    console.error('Get person error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Update person
export const updatePerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      name,
      gender,
      birth_date,
      death_date,
      birth_place,
      death_place,
      occupation,
      education,
      biography
    } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    if (!name || !name.trim()) {
      res.status(400).json({ message: '姓名不能为空' })
      return
    }

    // Check if user has permission to edit this person
    const { data: person, error: fetchError } = await supabase
      .from('persons')
      .select(`
        genealogy_id,
        genealogy:genealogies(owner_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !person) {
      res.status(404).json({ message: '人员不存在' })
      return
    }

    if ((person as any).genealogy.owner_id !== userId) {
      res.status(403).json({ message: '没有权限编辑此人员' })
      return
    }

    const personUpdate: Database['public']['Tables']['persons']['Update'] = {
      name: name.trim(),
      gender: gender || 'unknown',
      birth_date: birth_date || null,
      death_date: death_date || null,
      birth_place: birth_place?.trim() || null,
      death_place: death_place?.trim() || null,
      occupation: occupation?.trim() || null,
      biography: biography?.trim() || null,
      photo_url: req.body.photo_url || null,
      generation: req.body.generation || null
    }

    const { data, error } = await (supabase as any)
      .from('persons')
      .update(personUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update person error:', error)
      res.status(500).json({ message: '更新人员失败' })
      return
    }

    res.json({
      message: '人员信息更新成功',
      person: data
    })
  } catch (error) {
    console.error('Update person error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Delete person
export const deletePerson = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    // Check if user has permission to delete this person
    const { data: person, error: fetchError } = await supabase
      .from('persons')
      .select(`
        genealogy_id,
        genealogy:genealogies(owner_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      res.status(404).json({ message: '人员不存在' })
      return
    }

    if (!person || (person as any).genealogy.owner_id !== userId) {
      res.status(403).json({ message: '没有权限删除此人员' })
      return
    }

    // Delete related relationships first
    await supabase
      .from('relationships')
      .delete()
      .or(`person1_id.eq.${id},person2_id.eq.${id}`)

    // Delete the person
    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete person error:', error)
      res.status(500).json({ message: '删除人员失败' })
      return
    }

    res.json({ message: '人员删除成功' })
  } catch (error) {
    console.error('Delete person error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Get person relationships
export const getPersonRelationships = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    // Check if user has access to this person
    const { data: person, error: personError } = await supabase
      .from('persons')
      .select(`
        genealogy:genealogies(owner_id, privacy_level)
      `)
      .eq('id', id)
      .single()

    if (personError) {
      res.status(404).json({ message: '人员不存在' })
      return
    }

    if (!person || ((person as any).genealogy.owner_id !== userId && (person as any).genealogy.privacy_level !== 'public')) {
      res.status(403).json({ message: '没有权限访问此人员的关系信息' })
      return
    }

    // Get relationships where this person is involved
    const { data, error } = await supabase
      .from('relationships')
      .select(`
        *,
        person1:persons!relationships_person1_id_fkey(id, name),
        person2:persons!relationships_person2_id_fkey(id, name)
      `)
      .or(`person1_id.eq.${id},person2_id.eq.${id}`)

    if (error) {
      console.error('Get person relationships error:', error)
      res.status(500).json({ message: '获取关系信息失败' })
      return
    }

    res.json({ relationships: data })
  } catch (error) {
    console.error('Get person relationships error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Create relationship
export const createRelationship = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params // person1_id
    const { person2_id, relationship_type } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    if (!person2_id || !relationship_type) {
      res.status(400).json({ message: '关系人员和关系类型不能为空' })
      return
    }

    // Check if user has permission to create relationships for both persons
    const { data: persons, error: personsError } = await supabase
      .from('persons')
      .select(`
        id,
        genealogy:genealogies(owner_id)
      `)
      .in('id', [id, person2_id])

    if (personsError || persons.length !== 2) {
      res.status(404).json({ message: '人员不存在' })
      return
    }

    // Check permissions for both persons
    const hasPermission = persons.every((person: any) => person.genealogy.owner_id === userId)
    if (!hasPermission) {
      res.status(403).json({ message: '没有权限创建此关系' })
      return
    }

    // Check if relationship already exists
    const { data: existingRelationship } = await supabase
      .from('relationships')
      .select('id')
      .or(`and(person1_id.eq.${id},person2_id.eq.${person2_id}),and(person1_id.eq.${person2_id},person2_id.eq.${id})`)
      .single()

    if (existingRelationship) {
      res.status(400).json({ message: '关系已存在' })
      return
    }

    // Get genealogy_id from one of the persons
    const { data: personData, error: personError } = await supabase
      .from('persons')
      .select('genealogy_id')
      .eq('id', id)
      .single()

    if (personError || !personData) {
      res.status(404).json({ message: '人员不存在' })
      return
    }

    const relationshipInsert: Database['public']['Tables']['relationships']['Insert'] = {
      genealogy_id: (personData as any).genealogy_id,
      person1_id: id,
      person2_id,
      relationship_type
    }

    const { data, error } = await (supabase as any)
      .from('relationships')
      .insert(relationshipInsert)
      .select(`
        *,
        person1:persons!relationships_person1_id_fkey(id, name),
        person2:persons!relationships_person2_id_fkey(id, name)
      `)
      .single()

    if (error) {
      console.error('Create relationship error:', error)
      res.status(500).json({ message: '创建关系失败' })
      return
    }

    res.status(201).json({
      message: '关系创建成功',
      relationship: data
    })
  } catch (error) {
    console.error('Create relationship error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}

// Delete relationship
export const deleteRelationship = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id, relationshipId } = req.params
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({ message: '用户未认证' })
      return
    }

    // Check if user has permission to delete this relationship
    const { data: relationship, error: fetchError } = await (supabase as any)
      .from('relationships')
      .select(`
        *,
        person1:persons!relationships_person1_id_fkey(
          *,
          genealogy:genealogies(owner_id, privacy_level)
        ),
        person2:persons!relationships_person2_id_fkey(
          *,
          genealogy:genealogies(owner_id, privacy_level)
        )
      `)
      .eq('id', relationshipId)
      .or(`person1_id.eq.${id},person2_id.eq.${id}`)
      .single()

    if (fetchError || !relationship) {
      res.status(404).json({ message: '关系不存在' })
      return
    }

    // Check permissions
    const hasPermission = (relationship.person1 as any)?.genealogy?.owner_id === userId ||
                          (relationship.person2 as any)?.genealogy?.owner_id === userId
    
    if (!hasPermission) {
      res.status(403).json({ message: '没有权限删除此关系' })
      return
    }

    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('id', relationshipId)

    if (error) {
      console.error('Delete relationship error:', error)
      res.status(500).json({ message: '删除关系失败' })
      return
    }

    res.json({ message: '关系删除成功' })
  } catch (error) {
    console.error('Delete relationship error:', error)
    res.status(500).json({ message: '服务器内部错误' })
  }
}