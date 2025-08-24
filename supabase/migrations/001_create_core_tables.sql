-- 族谱编排系统核心数据表创建脚本
-- 创建时间: 2025-01-22

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'genealogy_admin', 'researcher')),
    avatar_url TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 创建族谱表
CREATE TABLE genealogies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    family_name VARCHAR(100) NOT NULL,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建族谱表索引
CREATE INDEX idx_genealogies_creator ON genealogies(creator_id);
CREATE INDEX idx_genealogies_family_name ON genealogies(family_name);
CREATE INDEX idx_genealogies_status ON genealogies(status);

-- 创建人物表
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genealogy_id UUID REFERENCES genealogies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unknown')),
    birth_date DATE,
    death_date DATE,
    birth_place VARCHAR(200),
    death_place VARCHAR(200),
    biography TEXT,
    occupation VARCHAR(100),
    education VARCHAR(200),
    custom_fields JSONB DEFAULT '{}',
    photo_url TEXT,
    generation INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建人物表索引
CREATE INDEX idx_persons_genealogy ON persons(genealogy_id);
CREATE INDEX idx_persons_name ON persons(name);
CREATE INDEX idx_persons_generation ON persons(generation);
CREATE INDEX idx_persons_birth_date ON persons(birth_date);

-- 创建关系表
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    to_person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'father', 'mother', 'son', 'daughter', 'spouse', 'brother', 'sister',
        'grandfather', 'grandmother', 'grandson', 'granddaughter', 'uncle', 'aunt',
        'nephew', 'niece', 'cousin', 'other'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_person_id, to_person_id, relationship_type)
);

-- 创建关系表索引
CREATE INDEX idx_relationships_from ON relationships(from_person_id);
CREATE INDEX idx_relationships_to ON relationships(to_person_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- 创建人物事件表
CREATE TABLE person_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'birth', 'death', 'marriage', 'education', 'career', 'migration', 'other'
    )),
    event_date DATE,
    location VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建人物事件表索引
CREATE INDEX idx_person_events_person ON person_events(person_id);
CREATE INDEX idx_person_events_type ON person_events(event_type);
CREATE INDEX idx_person_events_date ON person_events(event_date);

-- 创建地理位置表
CREATE TABLE geo_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    location_type VARCHAR(50) CHECK (location_type IN (
        'birthplace', 'residence', 'workplace', 'burial', 'historical_site', 'other'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建地理位置表索引
CREATE INDEX idx_geo_locations_name ON geo_locations(name);
CREATE INDEX idx_geo_locations_type ON geo_locations(location_type);
CREATE INDEX idx_geo_locations_coords ON geo_locations(latitude, longitude);

-- 创建历史事件表
CREATE TABLE historical_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES geo_locations(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    event_type VARCHAR(50) CHECK (event_type IN (
        'political', 'military', 'cultural', 'natural', 'economic', 'social', 'other'
    )),
    sources JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建历史事件表索引
CREATE INDEX idx_historical_events_location ON historical_events(location_id);
CREATE INDEX idx_historical_events_type ON historical_events(event_type);
CREATE INDEX idx_historical_events_date ON historical_events(start_date, end_date);

-- 创建族谱书籍表
CREATE TABLE genealogy_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genealogy_id UUID REFERENCES genealogies(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    book_type VARCHAR(20) CHECK (book_type IN ('pdf', 'ebook', 'web')),
    template_config JSONB DEFAULT '{}',
    file_path TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建族谱书籍表索引
CREATE INDEX idx_genealogy_books_genealogy ON genealogy_books(genealogy_id);
CREATE INDEX idx_genealogy_books_type ON genealogy_books(book_type);
CREATE INDEX idx_genealogy_books_status ON genealogy_books(status);

-- 创建OCR任务表
CREATE TABLE ocr_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    recognition_result JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    confidence DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建OCR任务表索引
CREATE INDEX idx_ocr_tasks_user ON ocr_tasks(user_id);
CREATE INDEX idx_ocr_tasks_status ON ocr_tasks(status);
CREATE INDEX idx_ocr_tasks_created ON ocr_tasks(created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_genealogies_updated_at BEFORE UPDATE ON genealogies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据
-- 插入系统管理员用户
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@genealogy.com', crypt('admin123', gen_salt('bf')), '系统管理员', 'admin');

-- 插入示例地理位置
INSERT INTO geo_locations (name, address, location_type, latitude, longitude) VALUES
('北京市', '中国北京市', 'historical_site', 39.9042, 116.4074),
('上海市', '中国上海市', 'historical_site', 31.2304, 121.4737),
('广州市', '中国广东省广州市', 'historical_site', 23.1291, 113.2644);

-- 设置行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE genealogies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE genealogy_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_tasks ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略
-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 族谱访问策略
CREATE POLICY "Users can view own genealogies" ON genealogies
    FOR SELECT USING (auth.uid() = creator_id OR is_public = true);

CREATE POLICY "Users can create genealogies" ON genealogies
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own genealogies" ON genealogies
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own genealogies" ON genealogies
    FOR DELETE USING (auth.uid() = creator_id);

-- 人物访问策略
CREATE POLICY "Users can view persons in accessible genealogies" ON persons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM genealogies g 
            WHERE g.id = genealogy_id 
            AND (g.creator_id = auth.uid() OR g.is_public = true)
        )
    );

CREATE POLICY "Users can manage persons in own genealogies" ON persons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM genealogies g 
            WHERE g.id = genealogy_id 
            AND g.creator_id = auth.uid()
        )
    );

-- 关系访问策略
CREATE POLICY "Users can view relationships in accessible genealogies" ON relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM persons p 
            JOIN genealogies g ON p.genealogy_id = g.id
            WHERE p.id = from_person_id 
            AND (g.creator_id = auth.uid() OR g.is_public = true)
        )
    );

CREATE POLICY "Users can manage relationships in own genealogies" ON relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM persons p 
            JOIN genealogies g ON p.genealogy_id = g.id
            WHERE p.id = from_person_id 
            AND g.creator_id = auth.uid()
        )
    );

-- OCR任务访问策略
CREATE POLICY "Users can view own OCR tasks" ON ocr_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create OCR tasks" ON ocr_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OCR tasks" ON ocr_tasks
    FOR UPDATE USING (auth.uid() = user_id);