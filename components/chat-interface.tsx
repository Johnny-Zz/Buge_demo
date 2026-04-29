"use client"

import { ArrowLeft, Menu, Mic, Smile, Plus } from "lucide-react"
import { StatusBar } from "./status-bar"
import { SummonAgentButton } from "./summon-agent-button"

interface ChatInterfaceProps {
  onSummonAgent: () => void | Promise<void>
  onBack: () => void
  isParsing?: boolean
}

export function ChatInterface({ onSummonAgent, onBack, isParsing = false }: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-screen bg-[#111111]">
      {/* Unified Status Bar */}
      <StatusBar />

      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 bg-[#111111]">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1.5">
          <h1 className="text-base font-medium text-white">
            XX大学开源安全奖励计划2025(295)
          </h1>
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-[8px] text-white">◎</span>
          </div>
        </div>
        <button className="p-2 -mr-2 text-white hover:text-gray-300 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Chat Timeline */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4">
        {/* First Message - Tencent Meeting Card with Avatar */}
        <div className="flex gap-2.5 items-start">
          {/* Avatar - QQ Default Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#12B7F5] to-[#0099FF] flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <ellipse cx="50" cy="38" rx="22" ry="24" fill="white"/>
              <ellipse cx="50" cy="85" rx="30" ry="18" fill="white"/>
              <circle cx="42" cy="35" r="3" fill="#333"/>
              <circle cx="58" cy="35" r="3" fill="#333"/>
            </svg>
          </div>

          <div className="flex-1 max-w-[300px]">
            {/* Sender name with tag */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded">群主</span>
              <span className="text-sm text-gray-400">X老师</span>
            </div>

            {/* Meeting Card */}
            <div className="bg-[#262b38] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">云议</p>
              <p className="text-white text-[15px] leading-relaxed">
                <span className="text-white">会议主题：</span>奖励计划经验宣讲会
              </p>
              <p className="text-white text-[15px] leading-relaxed">
                <span className="text-white">会议时间：</span>2026/04/22
              </p>
              <p className="text-white text-[15px] leading-relaxed">
                14:30-16:30 (GMT+08:00) 中国标准时间 - 北京
              </p>
              <p className="text-white text-[15px] leading-relaxed mt-1">
                <span className="text-white">重复周期：</span>
              </p>
              <p className="text-white text-[15px] leading-relaxed">
                2026/04/<span className="text-[#5b9bd5]">22-2026</span>/06/03
              </p>
              <p className="text-white text-[15px] leading-relaxed">
                14:30-16:30, 每周（周三）
              </p>
              
              <p className="text-white text-[15px] leading-relaxed mt-4">
                点击链接入会，或添加至会议列表：
              </p>
              <a href="#" className="text-[#5b9bd5] text-[15px] leading-relaxed underline block break-all">
                https://meeting.tencent.com/dm/xxxx
              </a>
              
              <p className="text-white text-[15px] leading-relaxed mt-3">
                #腾讯会议：<a href="#" className="text-[#5b9bd5] underline">xxx-xxx-xxx</a>
              </p>
              
              <p className="text-white text-[15px] leading-relaxed mt-3">
                复制该信息，打开手机腾讯会议即可参与
              </p>
            </div>
          </div>
        </div>

        {/* Time indicator */}
        <div className="flex justify-center">
          <span className="text-sm text-gray-500">
            上午10:14
          </span>
        </div>

        {/* Message from 曹坤老师 with schedule image */}
        <div className="flex gap-2.5 items-start">
          {/* Avatar - QQ Default Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#12B7F5] to-[#0099FF] flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <ellipse cx="50" cy="38" rx="22" ry="24" fill="white"/>
              <ellipse cx="50" cy="85" rx="30" ry="18" fill="white"/>
              <circle cx="42" cy="35" r="3" fill="#333"/>
              <circle cx="58" cy="35" r="3" fill="#333"/>
            </svg>
          </div>

          <div className="flex-1 max-w-[300px]">
            {/* Sender name with tag */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded">群主</span>
              <span className="text-sm text-gray-400">X老师</span>
            </div>

            {/* Schedule Document Image */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="p-4">
                <h3 className="text-center text-black font-medium text-sm mb-4">
                  开源安全奖励计划经验宣讲会日程
                </h3>
                
                <div className="space-y-3 text-xs text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900">一、讲座时间</p>
                    <p className="ml-4">2026年4月22日（周三）14:30—16:30</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">二、讲座方式</p>
                    <p className="ml-4">腾讯会议（会议室号：xxx-xxx-xxx）</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">三、讲座流程</p>
                    <table className="ml-4 mt-1 border border-gray-300 text-[10px] w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1 text-center font-medium">时间</th>
                          <th className="border border-gray-300 px-2 py-1 text-center font-medium">内容</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">14:30—15:00</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">
                            <p>原创开源软件赛道</p>
                            <p>一等奖</p>
                            <p>XX大学  张*</p>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">15:00—15:30</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">
                            <p>开源软件改写赛道</p>
                            <p>二等奖</p>
                            <p>YY大学  李*</p>
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">15:30—16:00</td>
                          <td className="border border-gray-300 px-2 py-1.5 text-center">
                            <p>优秀指导教师</p>
                            <p>ZZ大学  王*</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summon Agent Button - Reusable component inside scrollable area */}
        <SummonAgentButton onSummonAgent={onSummonAgent} isLoading={isParsing} />
      </div>

      {/* Input area - QQ style */}
      <div className="p-3 bg-[#111111] border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Mic className="w-6 h-6" />
          </button>
          <div className="flex-1 bg-[#2a2a2a] rounded-full px-4 py-2">
            <input 
              type="text"
              placeholder=""
              className="w-full bg-transparent text-white text-sm outline-none"
            />
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
