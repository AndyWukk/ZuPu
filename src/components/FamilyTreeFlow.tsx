import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User, Calendar, MapPin } from 'lucide-react';

interface PersonData {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  generation: number;
  photo_url?: string;
}

interface PersonNodeProps {
  data: PersonData & {
    onPersonClick?: (person: PersonData) => void;
  };
}

const PersonNode: React.FC<PersonNodeProps> = ({ data }) => {
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
    <Card className="p-3 min-w-[200px] cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
      <div className="flex items-center gap-3">
        {data.photo_url ? (
          <img
            src={data.photo_url}
            alt={data.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            data.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
          }`}>
            <User className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{data.name}</h3>
            <Badge variant={data.gender === 'male' ? 'default' : 'secondary'}>
              {data.gender === 'male' ? '男' : '女'}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            {data.birth_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(data.birth_date).getFullYear()}
                  {data.death_date && ` - ${new Date(data.death_date).getFullYear()}`}
                  {getAge() && ` (${getAge()}岁)`}
                </span>
              </div>
            )}
            {data.birth_place && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{data.birth_place}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  person: PersonNode,
};

interface FamilyTreeFlowProps {
  persons: PersonData[];
  relationships: Array<{
    id: string;
    person1_id: string;
    person2_id: string;
    relationship_type: string;
  }>;
  onPersonClick?: (person: PersonData) => void;
  className?: string;
}

export const FamilyTreeFlow: React.FC<FamilyTreeFlowProps> = ({
  persons,
  relationships,
  onPersonClick,
  className = ''
}) => {
  // 生成节点和边
  const { initialNodes, initialEdges } = useMemo(() => {
    // 按世代分组
    const generationGroups = persons.reduce((acc, person) => {
      if (!acc[person.generation]) {
        acc[person.generation] = [];
      }
      acc[person.generation].push(person);
      return acc;
    }, {} as Record<number, PersonData[]>);

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
            x: personIndex * 250 + 100,
            y: genIndex * 200 + 100
          },
          data: {
            ...person,
            onPersonClick
          }
        });
      });
    });

    // 生成边
    const edges: Edge[] = relationships.map((rel, index) => ({
      id: rel.id || `edge-${index}`,
      source: rel.person1_id,
      target: rel.person2_id,
      type: 'smoothstep',
      label: rel.relationship_type === 'parent' ? '父子' : 
             rel.relationship_type === 'spouse' ? '夫妻' : 
             rel.relationship_type === 'sibling' ? '兄弟姐妹' : rel.relationship_type,
      labelStyle: { fontSize: 12, fontWeight: 600 },
      style: {
        stroke: rel.relationship_type === 'parent' ? '#3B82F6' :
                rel.relationship_type === 'spouse' ? '#EF4444' :
                rel.relationship_type === 'sibling' ? '#10B981' : '#6B7280',
        strokeWidth: 2
      }
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [persons, relationships, onPersonClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`h-[600px] w-full ${className}`}>
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
          nodeStrokeColor={(n) => {
            const person = n.data as PersonData;
            return person.gender === 'male' ? '#3B82F6' : '#EC4899';
          }}
          nodeColor={(n) => {
            const person = n.data as PersonData;
            return person.gender === 'male' ? '#DBEAFE' : '#FCE7F3';
          }}
          nodeBorderRadius={2}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default FamilyTreeFlow;