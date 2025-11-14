import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useExtensionCommunication } from '@/utils/extension-communication';
import { Wifi, WifiOff, RefreshCw, Chrome } from 'lucide-react';

export function ExtensionStatus() {
  const { isConnected, syncStatus, triggerSync } = useExtensionCommunication();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (syncStatus && syncStatus.queueLength > 0) {
      setIsSyncing(true);
    } else {
      setIsSyncing(false);
    }
  }, [syncStatus]);

  const handleSyncClick = async () => {
    if (!isConnected) return;

    setIsSyncing(true);
    try {
      await triggerSync({ force: true });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setTimeout(() => setIsSyncing(false), 3000);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isSyncing) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isConnected) return '扩展未连接';
    if (isSyncing) return '同步中...';
    return '扩展已连接';
  };

  const getSyncStatusText = () => {
    if (!syncStatus) return '状态未知';
    if (syncStatus.queueLength > 0) return `待同步: ${syncStatus.queueLength}`;
    if (syncStatus.lastSync) {
      const lastSync = new Date(syncStatus.lastSync);
      return `最后同步: ${lastSync.toLocaleTimeString()}`;
    }
    return '等待同步';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
      {/* 连接状态指示器 */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </span>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {/* Chrome扩展图标 */}
      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
        <Chrome className="w-3 h-3 text-white" />
      </div>

      {/* 分隔线 */}
      <div className="w-px h-4 bg-gray-300" />

      {/* 同步状态 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{getSyncStatusText()}</span>
      </div>

      {/* 操作按钮 */}
      {isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          立即同步
        </Button>
      )}

      {/* 未连接时的提示 */}
      {!isConnected && (
        <Badge variant="outline" className="ml-auto text-orange-600 border-orange-600">
          请安装ChatMergeX扩展
        </Badge>
      )}
    </div>
  );
}