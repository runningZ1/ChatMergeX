import React from 'react'
import { Settings as SettingsIcon, Palette, Globe, Database, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <SettingsIcon className="size-6" />
            <span>设置</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            管理您的应用偏好设置和数据
          </p>
        </div>

        <div className="grid gap-6">
          {/* 外观设置 */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="size-5" />
              <h2 className="text-lg font-semibold">外观设置</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">主题</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                  >
                    浅色
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                  >
                    深色
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                  >
                    跟随系统
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">字体大小</label>
                <select className="w-full md:w-64 p-2 border rounded-md">
                  <option value="small">小</option>
                  <option value="medium" selected>中</option>
                  <option value="large">大</option>
                </select>
              </div>
            </div>
          </div>

          {/* 语言设置 */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="size-5" />
              <h2 className="text-lg font-semibold">语言和地区</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">语言</label>
                <select className="w-full md:w-64 p-2 border rounded-md">
                  <option value="zh-CN" selected>简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* 同步设置 */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="size-5" />
              <h2 className="text-lg font-semibold">同步设置</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">启用同步</label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="selection-checkbox" defaultChecked />
                  <span className="text-sm">自动同步对话记录</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">同步平台</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="selection-checkbox" defaultChecked />
                    <span className="text-sm">ChatGPT</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="selection-checkbox" defaultChecked />
                    <span className="text-sm">豆包</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="selection-checkbox" />
                    <span className="text-sm">Gemini</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">同步频率</label>
                <select className="w-full md:w-64 p-2 border rounded-md">
                  <option value="realtime" selected>实时</option>
                  <option value="5">5分钟</option>
                  <option value="15">15分钟</option>
                  <option value="60">1小时</option>
                </select>
              </div>
            </div>
          </div>

          {/* 数据管理 */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="size-5" />
              <h2 className="text-lg font-semibold">数据管理</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">总对话数：</span>
                  <span className="text-muted-foreground">13</span>
                </div>
                <div>
                  <span className="font-medium">存储空间：</span>
                  <span className="text-muted-foreground">2.3 MB</span>
                </div>
                <div>
                  <span className="font-medium">最后同步：</span>
                  <span className="text-muted-foreground">5分钟前</span>
                </div>
                <div>
                  <span className="font-medium">数据版本：</span>
                  <span className="text-muted-foreground">1.0.0</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  导出所有数据
                </Button>
                <Button variant="outline" size="sm">
                  导入数据
                </Button>
                <Button variant="outline" size="sm">
                  备份数据
                </Button>
                <Button variant="destructive" size="sm">
                  清空所有数据
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage