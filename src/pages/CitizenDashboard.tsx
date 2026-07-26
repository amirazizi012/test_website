import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Home, FileText, Search, Settings, LogOut, Send, Bot, User, Scale, AlertTriangle, ChevronLeft, Loader2, Copy, CheckCircle2, RotateCcw, Building2, Target } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Button } from "../components/ui/Button";
import { getCurrentUser, logout, apiFetch } from "../lib/auth";

const SIDEBAR_ITEMS = [
  { icon: Home, label: "داشبورد", active: false, path: "/dashboard/citizen" },
  { icon: Bot, label: "مشاوره هوشمند AI", active: true, path: "/dashboard/citizen" },
  { icon: Building2, label: "سامانه ارجاع حمایتی", active: false, path: "/dashboard/support" },
  { icon: Target, label: "مسیر مطالبه خسارت", active: false, path: "/dashboard/damage-claim" },
  { icon: Scale, label: "پایگاه هوشمند قوانین", active: false, path: "/dashboard/laws" },
  { icon: AlertTriangle, label: "ثبت و پیگیری گزارش", active: false, path: "/dashboard/reports" },
];

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) navigate("/auth/login");
  }, [user, navigate]);

  const [queryTitle, setQueryTitle] = useState("");
  const [queryDesc, setQueryDesc] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string, timestamp: string}[]>([
    { 
      role: 'ai', 
      content: 'سلام. من **دستیار هوشمند حقوقی** شما در سامانه مدیریت بحران هستم.\n\nچه کمکی از من ساخته است؟\nشما می‌توانید سوالات خود را درباره:\n- حقوق شهروندی در زمان بحران\n- نحوه مطالبه خسارت\n- آدرس و مشخصات نهادهای امدادی\nاز من بپرسید.',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isAsking]);

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskQuestion = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!queryDesc.trim()) return;

    const userMessage = queryTitle.trim() ? `موضوع: ${queryTitle}\nشرح: ${queryDesc}` : queryDesc;
    const newUserMessage = { 
      role: 'user' as const, 
      content: userMessage,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [...prev, newUserMessage]);
    setQueryTitle("");
    setQueryDesc("");
    setIsAsking(true);

    try {
      const res = await apiFetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: userMessage.split('\n')[0].replace('موضوع: ', ''), 
          description: userMessage 
        })
      });

      if (res.status === 401) {
        setChatHistory(prev => [...prev, { role: 'ai', content: "نشست شما منقضی شده، لطفاً دوباره وارد حساب کاربری خود شوید.", timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }]);
        setIsAsking(false);
        return;
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      const newAiTimestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setChatHistory(prev => [...prev, { role: 'ai', content: '', timestamp: newAiTimestamp }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              setIsAsking(false);
              break;
            }
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  const lastIndex = newHistory.length - 1;
                  newHistory[lastIndex] = {
                    ...newHistory[lastIndex],
                    content: newHistory[lastIndex].content + data.text
                  };
                  return newHistory;
                });
              } else if (data.error) {
                 setChatHistory(prev => {
                  const newHistory = [...prev];
                  const lastIndex = newHistory.length - 1;
                  newHistory[lastIndex] = {
                    ...newHistory[lastIndex],
                    content: newHistory[lastIndex].content + "\n[خطا: " + data.error + (data.details ? " — " + data.details : "") + "]"
                  };
                  return newHistory;
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE JSON", e);
            }
          }
        }
      }
    } catch (e) {
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory[newHistory.length-1].role === 'ai' && newHistory[newHistory.length-1].content === '') {
           newHistory[newHistory.length-1].content = "خطا در ارتباط با سرور هوشمند.";
           return newHistory;
        } else {
           return [...prev, { role: 'ai', content: "خطا در ارتباط با سرور هوشمند.", timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }];
        }
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex text-[#1A2E35] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-[300px] bg-white border-l border-black/5 flex-shrink-0 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.02)] hidden lg:flex">
        <div className="h-[100px] flex items-center px-8 border-b border-black/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white font-bold">C</div>
            <span className="text-[24px] font-extrabold text-[#0F172A] tracking-tight">CrisisLaw</span>
          </Link>
        </div>
        
        <div className="p-6 flex-1 space-y-2">
          <p className="px-4 text-[14px] font-bold text-[#94A3B8] mb-6 tracking-wide">منوی شهروند</p>
          {SIDEBAR_ITEMS.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-[16px] transition-all text-[16px] font-semibold ${
                item.active 
                  ? "bg-[#F0FDF4] text-[#0D9488]" 
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <item.icon className={`w-[22px] h-[22px] ${item.active ? "text-[#0D9488]" : ""}`} />
              {item.label}
              {item.active && <ChevronLeft className="w-5 h-5 mr-auto opacity-70" />}
            </Link>
          ))}
        </div>

        <div className="p-6 border-t border-black/5">
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-all text-[16px] font-semibold"
          >
            <LogOut className="w-[22px] h-[22px]" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-[100px] flex items-center justify-between px-10 bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-10">
          <h2 className="text-[24px] font-bold text-[#0F172A]">مشاوره هوشمند AI</h2>
          <div className="flex items-center gap-5">
            <div className="text-left hidden sm:block">
              <p className="text-[16px] font-bold text-[#0F172A] leading-tight mb-1">{user?.fullName || "شهروند گرامی"}</p>
              <p className="text-[14px] text-[#64748B]">ایران، تهران</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#0D9488] border-4 border-white shadow-sm flex items-center justify-center text-white font-bold text-lg">
              {user?.firstName?.charAt(0) || "م"}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-10 pb-32 sm:pb-48 space-y-8 flex flex-col relative w-full h-full scroll-smooth">
           {chatHistory.map((msg, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               key={i} 
               className={`flex gap-4 sm:gap-5 w-full max-w-5xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
               style={{ width: '100%' }}
             >
               <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm mt-1 border-2 border-white ${msg.role === 'user' ? 'bg-[#0F172A] text-white' : 'bg-[#0D9488] text-white'}`}>
                 {msg.role === 'user' ? <User className="w-5 h-5 sm:w-6 sm:h-6" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6" />}
               </div>
               <div className={`max-w-[85%] sm:max-w-[75%] rounded-[24px] ${
                 msg.role === 'user' 
                  ? 'bg-white border border-black/5 rounded-tl-none text-[#0F172A] shadow-sm' 
                  : 'bg-transparent text-[#334155]'
               }`}>
                 
                 {msg.role === 'ai' && (
                   <div className="flex items-center gap-2 mb-2 px-1">
                     <span className="font-bold text-[15px] text-[#0F172A]">CrisisLaw AI</span>
                     <span className="text-[12px] text-[#94A3B8] font-medium">{msg.timestamp}</span>
                   </div>
                 )}

                 <div className={`px-5 sm:px-6 py-4 sm:py-5 ${msg.role === 'ai' ? 'px-0 py-0' : ''}`}>
                    {msg.role === 'user' ? (
                       <div className="whitespace-pre-wrap text-[16px] font-medium leading-[2] break-words">
                         {msg.content}
                         <div className="text-[12px] text-[#94A3B8] font-medium mt-2 text-left">{msg.timestamp}</div>
                       </div>
                    ) : (msg.content === '' && isAsking ? (
                       <div className="flex items-center gap-2 h-6 px-4">
                         <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-bounce"></span>
                         <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.2s]"></span>
                         <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-bounce [animation-delay:0.4s]"></span>
                       </div>
                    ) : (
                       <div className="markdown-body">
                         <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                           {msg.content}
                         </ReactMarkdown>
                       </div>
                    ))}
                 </div>

                 {/* Action Bar for AI */}
                 {msg.role === 'ai' && msg.content !== '' && (
                   <div className="flex items-center gap-2 mt-4 px-1">
                     <button 
                       onClick={() => handleCopy(msg.content, i)}
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors text-[13px] font-medium"
                     >
                       {copiedId === i ? <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> : <Copy className="w-4 h-4" />}
                       {copiedId === i ? "کپی شد" : "کپی"}
                     </button>
                     {i === chatHistory.length - 1 && !isAsking && (
                       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors text-[13px] font-medium">
                         <RotateCcw className="w-4 h-4" />
                         بازنویسی
                       </button>
                     )}
                   </div>
                 )}

               </div>
             </motion.div>
           ))}
           <div className="h-32 sm:h-48 shrink-0 w-full" aria-hidden="true"></div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#F4F7F5] via-[#F4F7F5] to-transparent pt-24 pb-8 px-4 sm:px-10 pointer-events-none">
          <form onSubmit={handleAskQuestion} className="max-w-4xl mx-auto bg-white border border-[#E2E8F0] rounded-[24px] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.06)] flex items-end gap-3 transition-all focus-within:border-[#0D9488] focus-within:ring-2 focus-within:ring-[#0D9488]/20 pointer-events-auto">
            <div className="flex-1 flex flex-col gap-3 p-3">
               {/* Title is optional but supported */}
               {queryTitle && (
                  <input 
                    type="text" 
                    placeholder="عنوان مشکل (مثلاً: عدم دریافت امداد زلزله)" 
                    className="bg-transparent border-none text-[#0F172A] text-[16px] focus:outline-none focus:ring-0 px-2 font-bold placeholder:text-[#94A3B8]"
                    value={queryTitle}
                    onChange={(e) => setQueryTitle(e.target.value)}
                    disabled={isAsking}
                  />
               )}
               {queryTitle && <div className="h-px w-full bg-[#E2E8F0]"></div>}
              <textarea 
                placeholder="جزئیات مشکل حقوقی یا خدماتی خود را شرح دهید..." 
                className="bg-transparent border-none text-[#0F172A] text-[16px] focus:outline-none focus:ring-0 min-h-[50px] max-h-[200px] resize-none px-2 py-1 placeholder:text-[#94A3B8] font-medium leading-[1.8]"
                value={queryDesc}
                onChange={(e) => setQueryDesc(e.target.value)}
                disabled={isAsking}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if(queryDesc.trim() && !isAsking) handleAskQuestion(e);
                  }
                }}
              />
            </div>
            <div className="p-2">
              <Button 
                type="submit" 
                disabled={isAsking || !queryDesc.trim()} 
                className="w-14 h-14 rounded-[16px] p-0 flex items-center justify-center bg-[#0F172A] hover:bg-[#1e293b]"
              >
                {isAsking ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Send className="w-6 h-6 text-white rtl:-scale-x-100" />}
              </Button>
            </div>
          </form>
          <p className="text-center text-[13px] font-medium text-[#64748B] mt-5">
            پاسخ‌های ارائه‌شده توسط هوش مصنوعی بر اساس قوانین مصوب مدیریت بحران ایران می‌باشد. امکان اشتباه در پاسخ‌ها وجود دارد.
          </p>
        </div>

      </main>
    </div>
  );
}
