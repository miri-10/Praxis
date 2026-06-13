"use client";

import { useState } from "react";
import { Sidebar }       from "@/components/sidebar";
import { ChatView }      from "@/components/chat-view";
import { ProjectsPage }  from "@/components/ProjectsPage";
import { ProjectDetail } from "@/components/ProjectDetail";

export default function Home() {
  const [section,     setSection]     = useState("chat");
  const [collapsed,   setCollapsed]   = useState(false);
  const [projectId,   setProjectId]   = useState<string | null>(null);

  const handleSection = (s: string) => {
    setSection(s);
    if (s !== "projects") setProjectId(null);
  };

  const mainView = () => {
    if (section === "projects") {
      return projectId
        ? <ProjectDetail projectId={projectId} onBack={() => setProjectId(null)} />
        : <ProjectsPage onSelectProject={setProjectId} />;
    }
    return <ChatView section={section} chatTitle="" />;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      <Sidebar
        activeSection={section}
        onSectionChange={handleSection}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      {mainView()}
    </div>
  );
}
