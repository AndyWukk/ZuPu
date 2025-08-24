import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, Calendar, MapPin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

interface SearchFilterProps {
  persons: Person[]
  onPersonSelect?: (person: Person) => void
  onFilterChange?: (filteredPersons: Person[]) => void
}

interface FilterCriteria {
  searchText: string
  gender: string
  birthYear: string
  birthPlace: string
  isAlive: string
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  persons,
  onPersonSelect,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<FilterCriteria>({
    searchText: '',
    gender: '',
    birthYear: '',
    birthPlace: '',
    isAlive: ''
  })
  
  const [filteredPersons, setFilteredPersons] = useState<Person[]>(persons)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // 获取所有出生地点用于筛选
  const birthPlaces = Array.from(new Set(
    persons.map(p => p.birth_place).filter(Boolean)
  )).sort()

  // 获取出生年代范围
  const birthYears = Array.from(new Set(
    persons.map(p => {
      if (p.birth_date) {
        const year = new Date(p.birth_date).getFullYear()
        return Math.floor(year / 10) * 10 // 按十年分组
      }
      return null
    }).filter(Boolean)
  )).sort((a, b) => (a || 0) - (b || 0))

  const applyFilters = () => {
    let filtered = persons

    // 姓名搜索（支持模糊匹配）
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(searchLower) ||
        person.biography?.toLowerCase().includes(searchLower)
      )
    }

    // 性别筛选
    if (filters.gender) {
      filtered = filtered.filter(person => person.gender === filters.gender)
    }

    // 出生年代筛选
    if (filters.birthYear) {
      const decade = parseInt(filters.birthYear)
      filtered = filtered.filter(person => {
        if (person.birth_date) {
          const year = new Date(person.birth_date).getFullYear()
          return year >= decade && year < decade + 10
        }
        return false
      })
    }

    // 出生地筛选
    if (filters.birthPlace) {
      filtered = filtered.filter(person => person.birth_place === filters.birthPlace)
    }

    // 在世状态筛选
    if (filters.isAlive) {
      if (filters.isAlive === 'alive') {
        filtered = filtered.filter(person => !person.death_date)
      } else if (filters.isAlive === 'deceased') {
        filtered = filtered.filter(person => !!person.death_date)
      }
    }

    setFilteredPersons(filtered)
    onFilterChange?.(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [filters, persons])

  const handleFilterChange = (key: keyof FilterCriteria, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      searchText: '',
      gender: '',
      birthYear: '',
      birthPlace: '',
      isAlive: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getAge = (person: Person) => {
    if (!person.birth_date) return null
    const birth = new Date(person.birth_date)
    const end = person.death_date ? new Date(person.death_date) : new Date()
    const age = end.getFullYear() - birth.getFullYear()
    return age
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索姓名或简介..."
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={showAdvancedFilters ? 'bg-blue-50' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          筛选
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            清除
          </Button>
        )}
      </div>

      {/* 高级筛选 */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">高级筛选</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 性别筛选 */}
              <div>
                <label className="text-sm font-medium mb-2 block">性别</label>
                <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 出生年代筛选 */}
              <div>
                <label className="text-sm font-medium mb-2 block">出生年代</label>
                <Select value={filters.birthYear} onValueChange={(value) => handleFilterChange('birthYear', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年代" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    {birthYears.map(year => (
                      <SelectItem key={year} value={year?.toString() || ''}>
                        {year}年代
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 出生地筛选 */}
              <div>
                <label className="text-sm font-medium mb-2 block">出生地</label>
                <Select value={filters.birthPlace} onValueChange={(value) => handleFilterChange('birthPlace', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择出生地" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    {birthPlaces.map(place => (
                      <SelectItem key={place} value={place}>
                        {place}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 在世状态筛选 */}
              <div>
                <label className="text-sm font-medium mb-2 block">在世状态</label>
                <Select value={filters.isAlive} onValueChange={(value) => handleFilterChange('isAlive', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部</SelectItem>
                    <SelectItem value="alive">在世</SelectItem>
                    <SelectItem value="deceased">已故</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 搜索结果统计 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          共找到 <span className="font-semibold">{filteredPersons.length}</span> 个结果
          {hasActiveFilters && (
            <span className="ml-2">
              （已筛选，共 {persons.length} 人）
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <div className="flex gap-2">
            {filters.gender && (
              <Badge variant="secondary">
                {filters.gender === 'male' ? '男' : '女'}
              </Badge>
            )}
            {filters.birthYear && (
              <Badge variant="secondary">
                {filters.birthYear}年代
              </Badge>
            )}
            {filters.birthPlace && (
              <Badge variant="secondary">
                {filters.birthPlace}
              </Badge>
            )}
            {filters.isAlive && (
              <Badge variant="secondary">
                {filters.isAlive === 'alive' ? '在世' : '已故'}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 搜索结果列表 */}
      <div className="space-y-2">
        {filteredPersons.length > 0 ? (
          filteredPersons.map(person => (
            <Card 
              key={person.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onPersonSelect?.(person)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={person.photo_url} />
                    <AvatarFallback>
                      {person.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{person.name}</h3>
                      <Badge variant={person.gender === 'male' ? 'default' : 'secondary'}>
                        {person.gender === 'male' ? '男' : '女'}
                      </Badge>
                      {getAge(person) && (
                        <Badge variant="outline">
                          {person.death_date ? `享年 ${getAge(person)}岁` : `${getAge(person)}岁`}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {person.birth_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>生于 {formatDate(person.birth_date)}</span>
                        </div>
                      )}
                      {person.birth_place && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{person.birth_place}</span>
                        </div>
                      )}
                    </div>
                    {person.biography && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {person.biography}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {hasActiveFilters ? '没有找到符合条件的人物' : '暂无人物信息'}
          </div>
        )}
      </div>
    </div>
  )
}