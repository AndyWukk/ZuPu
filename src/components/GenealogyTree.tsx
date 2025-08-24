import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User, Calendar, MapPin, Eye } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  photo_url?: string;
  biography?: string;
  genealogy_id: string;
  generation?: number;
}

interface Relationship {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: 'parent' | 'spouse' | 'sibling';
  person1?: Person;
  person2?: Person;
}

interface GenealogyTreeProps {
  persons: Person[];
  relationships: Relationship[];
  onPersonClick?: (person: Person) => void;
}

// 自定义节点组件
const PersonNode = ({ data }: { data: Person & { onPersonClick?: (person: Person) => void } }) => {
  const handleClick = () => {
    if (data.onPersonClick) {
      data.onPersonClick(data);
    }
  };

  const getAge = () => {
    if (!data.birth_date) return null;
    const birthYear = new Date(data.birth_date).getFullYear();
    const deathYear = data.death_date ? new Date(data.death_date).getFullYear() : new Date().getFullYear();
    return deathYear - birthYear;
  };

  return (
    <Card className="w-48 cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {data.photo_url ? (
              <img
                src={data.photo_url}
                alt={data.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{data.name}</h3>
            {data.gender && (
              <Badge variant={data.gender === 'male' ? 'default' : 'secondary'}>
                {data.gender === 'male' ? '男' : '女'}
              </Badge>
            )}
          </div>
        </div>
        
        {data.birth_date && (
          <div className="flex items-center text-xs text-gray-600 mb-1">
            <Calendar className="w-3 h-3 mr-1" />
            <span>
              {new Date(data.birth_date).getFullYear()}
              {data.death_date && ` - ${new Date(data.death_date).getFullYear()}`}
              {getAge() && ` (${getAge()}岁)`}
            </span>
          </div>
        )}
        
        {data.birth_place && (
          <div className="flex items-center text-xs text-gray-600 mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            <span>{data.birth_place}</span>
          </div>
        )}
        
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={handleClick}
        >
          <Eye className="w-3 h-3 mr-1" />
          查看详情
        </Button>
      </CardContent>
    </Card>
  );
};

// 节点类型定义
const nodeTypes = {
  person: PersonNode,
};

export const GenealogyTree: React.FC<GenealogyTreeProps> = ({
  persons,
  relationships,
  onPersonClick,
}) => {
  // 生成节点和边
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // 按世代分组
    const generationGroups = persons.reduce((groups, person) => {
      const gen = person.generation || 0;
      if (!groups[gen]) groups[gen] = [];
      groups[gen].push(person);
      return groups;
    }, {} as Record<number, Person[]>);

    // 生成节点
    const nodes: Node[] = [];
    const generations = Object.keys(generationGroups).map(Number).sort((a, b) => a - b);
    
    generations.forEach((generation, genIndex) => {
      const personsInGen = generationGroups[generation];
      personsInGen.forEach((person, personIndex) => {
        nodes.push({
          id: person.id,
          type: 'person',
          position: {
            x: personIndex * 250 - (personsInGen.length - 1) * 125,
            y: genIndex * 200,
          },
          data: {
            ...person,
            onPersonClick,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });

    // 生成边（关系连线）
    const edges: Edge[] = relationships
      .filter(rel => rel.relationship_type === 'parent')
      .map(rel => ({
        id: rel.id,
        source: rel.person1_id, // 父母
        target: rel.person2_id, // 子女
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      }));

    return { nodes, edges };
  }, [persons, relationships, onPersonClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const person = node.data as Person;
            return person.gender === 'male' ? '#3b82f6' : person.gender === 'female' ? '#ec4899' : '#6b7280';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default GenealogyTree;