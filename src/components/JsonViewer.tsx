import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Copy, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface JsonNode {
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  isExpanded: boolean;
  children?: JsonNode[];
}

interface JsonViewerProps {
  data: any;
  onNodeToggle?: (path: string) => void;
  expandedPaths?: Set<string>;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, onNodeToggle, expandedPaths = new Set() }) => {
  const createNode = (key: string, value: any, path: string): JsonNode => {
    const type = value === null ? 'null' : typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : typeof value;
    const isExpanded = expandedPaths.has(path);
    
    const node: JsonNode = {
      key,
      value,
      type,
      path,
      isExpanded
    };

    if (type === 'object' || type === 'array') {
      node.children = Object.entries(value || {}).map(([k, v]) => 
        createNode(k, v, `${path}.${k}`)
      );
    }

    return node;
  };

  const renderValue = (value: any, type: string) => {
    switch (type) {
      case 'string':
        return <span className="json-string">"{value}"</span>;
      case 'number':
        return <span className="json-number">{value}</span>;
      case 'boolean':
        return <span className="json-boolean">{value.toString()}</span>;
      case 'null':
        return <span className="json-null">null</span>;
      default:
        return null;
    }
  };

  const renderNode = (node: JsonNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const indent = depth * 20;

    return (
      <div key={node.path} className="tree-item">
        <div 
          className="flex items-center py-1 px-2 cursor-pointer"
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => hasChildren && onNodeToggle?.(node.path)}
        >
          {hasChildren ? (
            <button className="tree-expand-button mr-1 p-0.5 hover:bg-accent rounded">
              {node.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4 mr-1" />
          )}
          
          <span className="json-key mr-2">{node.key}</span>
          <span className="json-colon mr-2">:</span>
          
          {node.type === 'object' || node.type === 'array' ? (
            <span className="json-bracket">
              {node.type === 'array' ? '[' : '{'}
              {!node.isExpanded && (
                <>
                  <span className="text-muted-foreground text-xs ml-1">
                    {node.children?.length || 0} {node.type === 'array' ? 'items' : 'keys'}
                  </span>
                  <span className="ml-1">{node.type === 'array' ? ']' : '}'}</span>
                </>
              )}
            </span>
          ) : (
            renderValue(node.value, node.type)
          )}
        </div>
        
        {hasChildren && node.isExpanded && (
          <div>
            {node.children?.map(child => renderNode(child, depth + 1))}
            <div 
              className="json-bracket"
              style={{ paddingLeft: `${indent + 8}px` }}
            >
              {node.type === 'array' ? ']' : '}'}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!data) return null;

  const rootNode = createNode('root', data, 'root');
  rootNode.isExpanded = true;

  return (
    <div className="font-mono text-sm">
      {rootNode.children?.map(child => renderNode(child))}
    </div>
  );
};

const JsonEditor: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [activeTab, setActiveTab] = useState('tree');

  const sampleJson = {
    "name": "John Doe",
    "age": 30,
    "isActive": true,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "zipCode": "10001",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      }
    },
    "hobbies": ["reading", "swimming", "coding"],
    "spouse": null,
    "skills": {
      "programming": ["JavaScript", "Python", "React"],
      "languages": ["English", "Spanish"]
    }
  };

  useEffect(() => {
    setJsonInput(JSON.stringify(sampleJson, null, 2));
    setParsedJson(sampleJson);
  }, []);

  const validateAndParseJson = (input: string) => {
    if (!input.trim()) {
      setParsedJson(null);
      setValidationError('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setParsedJson(parsed);
      setValidationError('');
    } catch (error) {
      setValidationError((error as Error).message);
      setParsedJson(null);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateAndParseJson(jsonInput);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [jsonInput]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonInput);
      toast({
        title: "Copied to clipboard",
        description: "JSON content has been copied to your clipboard"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadJson = () => {
    if (!parsedJson) return;
    
    const blob = new Blob([JSON.stringify(parsedJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatJson = () => {
    if (parsedJson) {
      setJsonInput(JSON.stringify(parsedJson, null, 2));
    }
  };

  const minifyJson = () => {
    if (parsedJson) {
      setJsonInput(JSON.stringify(parsedJson));
    }
  };

  const handleNodeToggle = (path: string) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
    }
    setExpandedPaths(newExpandedPaths);
  };

  const expandAll = () => {
    const getAllPaths = (obj: any, currentPath: string = 'root'): string[] => {
      const paths = [currentPath];
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const newPath = `${currentPath}.${key}`;
          paths.push(...getAllPaths(obj[key], newPath));
        });
      }
      return paths;
    };

    if (parsedJson) {
      setExpandedPaths(new Set(getAllPaths(parsedJson)));
    }
  };

  const collapseAll = () => {
    setExpandedPaths(new Set(['root']));
  };

  const renderSyntaxHighlightedJson = (obj: any, depth: number = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    
    if (obj === null) {
      return <span className="json-null">null</span>;
    }
    
    if (typeof obj === 'string') {
      return <span className="json-string">"{obj}"</span>;
    }
    
    if (typeof obj === 'number') {
      return <span className="json-number">{obj}</span>;
    }
    
    if (typeof obj === 'boolean') {
      return <span className="json-boolean">{obj.toString()}</span>;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return <span className="json-bracket">[]</span>;
      }
      
      return (
        <span>
          <span className="json-bracket">[</span>
          {obj.map((item, index) => (
            <span key={index}>
              <br />{indent}  {renderSyntaxHighlightedJson(item, depth + 1)}
              {index < obj.length - 1 && <span className="json-comma">,</span>}
            </span>
          ))}
          <br />{indent}<span className="json-bracket">]</span>
        </span>
      );
    }
    
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return <span className="json-brace">{'{}'}</span>;
      }
      
      return (
        <span>
          <span className="json-brace">{'{'}</span>
          {keys.map((key, index) => (
            <span key={key}>
              <br />{indent}  <span className="json-key">"{key}"</span>
              <span className="json-colon">: </span>
              {renderSyntaxHighlightedJson(obj[key], depth + 1)}
              {index < keys.length - 1 && <span className="json-comma">,</span>}
            </span>
          ))}
          <br />{indent}<span className="json-brace">{'}'}</span>
        </span>
      );
    }
    
    return String(obj);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          JSON Explorer
        </h1>
        <p className="text-muted-foreground">
          View, format, and analyze JSON data with syntax highlighting and tree visualization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                JSON Input
                {validationError ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Invalid
                  </Badge>
                ) : parsedJson ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Valid
                  </Badge>
                ) : null}
              </CardTitle>
              
              <div className="flex gap-2">
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Button onClick={formatJson} variant="outline" size="sm" disabled={!parsedJson}>
                  Format
                </Button>
                
                <Button onClick={minifyJson} variant="outline" size="sm" disabled={!parsedJson}>
                  Minify
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste your JSON here or upload a file..."
              className="min-h-[400px] font-mono text-sm"
            />
            
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>JSON Viewer</CardTitle>
              
              <div className="flex gap-2">
                {activeTab === 'tree' && (
                  <>
                    <Button onClick={expandAll} variant="outline" size="sm" disabled={!parsedJson}>
                      Expand All
                    </Button>
                    <Button onClick={collapseAll} variant="outline" size="sm" disabled={!parsedJson}>
                      Collapse All
                    </Button>
                  </>
                )}
                
                <Button onClick={copyToClipboard} variant="outline" size="sm" disabled={!parsedJson}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                
                <Button onClick={downloadJson} variant="outline" size="sm" disabled={!parsedJson}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {parsedJson ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="tree">Tree View</TabsTrigger>
                  <TabsTrigger value="formatted">Formatted View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tree" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-auto">
                    <JsonViewer
                      data={parsedJson}
                      onNodeToggle={handleNodeToggle}
                      expandedPaths={expandedPaths}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="formatted" className="mt-4">
                  <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-auto">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {renderSyntaxHighlightedJson(parsedJson)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                {validationError ? 'Fix JSON errors to view data' : 'Enter valid JSON to see the visualization'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JsonEditor;