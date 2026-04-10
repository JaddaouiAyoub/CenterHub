"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Calendar as CalendarIcon,
  Filter,
  FileIcon,
  Video,
  ImageIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStudentResources } from "@/actions/resources";
import { DocumentViewer } from "../teacher/DocumentViewer";

export function StudentResources({ profile }: { profile: any }) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      const res = await getStudentResources(profile.id);
      if (res.resources) setResources(res.resources);
      setLoading(false);
    };
    fetchResources();
  }, [profile.id]);

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
    r.courseName?.toLowerCase().includes(search.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF": return <FileText className="w-8 h-8 text-red-500" />;
      case "VIDEO": return <Video className="w-8 h-8 text-blue-500" />;
      case "IMAGE": return <ImageIcon className="w-8 h-8 text-emerald-500" />;
      default: return <FileIcon className="w-8 h-8 text-slate-400" />;
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement de vos documents...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center space-x-4">
           <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-900 font-heading">Supports de Cours</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">{resources.length} fichiers disponibles</p>
           </div>
        </div>
        
        <div className="relative w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <Input 
              placeholder="Rechercher par nom, matière, cours..." 
              className="pl-12 h-12 bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 rounded-2xl font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="group border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                  {getFileIcon(resource.type)}
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-slate-100 border-none text-slate-500">
                  {resource.type}
                </Badge>
              </div>

              <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                {resource.name}
              </h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-4">
                {resource.subjectName} • {resource.courseName}
              </p>

              <div className="flex items-center space-x-2 pt-4 border-t border-slate-50">
                <DocumentViewer 
                  id={resource.id}
                  name={resource.name}
                  type={resource.type}
                  trigger={
                    <Button 
                      size="sm" 
                      className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl"
                    >
                      <Eye className="w-3.5 h-3.5 mr-2" /> Ouvrir
                    </Button>
                  }
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-9 w-9 border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredResources.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <div className="inline-flex p-6 bg-slate-50 rounded-full mb-4">
                <FileText className="w-12 h-12 text-slate-300" />
             </div>
             <p className="text-slate-400 italic">Aucun document trouvé pour cette recherche.</p>
          </div>
        )}
      </div>

    </div>
  );
}
