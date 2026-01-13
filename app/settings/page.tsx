'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, DollarSign, Globe, Sparkles, ExternalLink, Check, X, Eye, EyeOff } from 'lucide-react';

interface SettingsData {
  groqApiKey: string | null;
  theme: string;
  currency: string;
  language: string;
  dailyUsageCount?: number;
  lastUsageDate?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    groqApiKey: null,
    theme: 'dark',
    currency: 'VND',
    language: 'Tiếng Việt',
    dailyUsageCount: 0,
    lastUsageDate: undefined
  });
  const [usageStats, setUsageStats] = useState({ dailyCount: 0, limit: 1000, remaining: 1000 });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      setApiKeyInput(data.groqApiKey === '***' ? '' : (data.groqApiKey || ''));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groqApiKey: apiKeyInput.trim() || null,
          theme: settings.theme,
          currency: settings.currency,
          language: settings.language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSaveMessage('Đã lưu thành công! ✅');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const errorData = await res.json();
        console.error('Save error:', errorData);
        setSaveMessage(`Lỗi: ${errorData.message || errorData.error || 'Vui lòng thử lại'}`);
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setSaveMessage(`Lỗi khi lưu: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setSaving(false);
    }
  };

  const testApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setSaveMessage('Vui lòng nhập API key để test.');
      return;
    }

    setSaving(true);
    setSaveMessage('Đang kiểm tra API key...');
    
    try {
      // Test by calling a simple Groq API
      const testRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'test' })
      });
      
      if (testRes.ok) {
        setSaveMessage('API key hợp lệ! ✅');
      } else {
        setSaveMessage('API key không hợp lệ hoặc có lỗi. ⚠️');
      }
    } catch (error) {
      setSaveMessage('Không thể kiểm tra API key. Vui lòng thử lại.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Đang tải settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-slate-400">Configure planner + finance preferences.</p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`rounded-xl border p-4 ${
          saveMessage.includes('thành công') || saveMessage.includes('hợp lệ')
            ? 'bg-green-500/10 border-green-500/50 text-green-300'
            : 'bg-red-500/10 border-red-500/50 text-red-300'
        }`}>
          <p className="text-sm">{saveMessage}</p>
        </div>
      )}

      {/* Groq AI API Key */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Groq AI API Key</h3>
              <p className="text-sm text-slate-400">
                {settings.groqApiKey === '***' || apiKeyInput
                  ? 'API key đã được cấu hình'
                  : 'Chưa có API key - đang dùng rule-based parsing'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="text-sm text-primary hover:underline"
          >
            {showGuide ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}
          </button>
        </div>

        {showGuide && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white">📖 Hướng dẫn lấy Groq API Key miễn phí:</h4>
            <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
              <li>
                <strong>Truy cập Groq Console:</strong>{' '}
                <a
                  href="https://console.groq.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  https://console.groq.com/
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <strong>Đăng ký/Đăng nhập:</strong> Click "Sign Up" hoặc "Log In" (miễn phí, không cần credit card)
              </li>
              <li>
                <strong>Tạo API Key:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Vào menu <strong>API Keys</strong> (góc trên bên phải)</li>
                  <li>Click <strong>"Create API Key"</strong></li>
                  <li>Đặt tên cho API key (ví dụ: "Calendar App")</li>
                  <li>Click <strong>"Submit"</strong></li>
                  <li>
                    <strong className="text-yellow-400">Copy API key ngay!</strong> (sẽ không hiển thị lại)
                  </li>
                </ul>
              </li>
              <li>
                <strong>Dán API key vào ô bên dưới</strong> và click "Lưu"
              </li>
            </ol>
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-300">
                <strong>💡 Lưu ý:</strong> API key có dạng <code className="bg-slate-700 px-1 rounded">gsk_xxxxxxxxxxxxx</code>. 
                Nếu không có API key, ứng dụng vẫn hoạt động với rule-based parsing (chậm hơn và ít chính xác hơn).
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={settings.groqApiKey === '***' ? 'API key đã được lưu (nhập mới để thay đổi)' : 'gsk_your_api_key_here'}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={testApiKey}
                disabled={!apiKeyInput.trim() || saving}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              API key được lưu an toàn trong database. Để trống để sử dụng rule-based parsing.
            </p>
          </div>
          
          {/* Usage Stats */}
          {(settings.groqApiKey === '***' || apiKeyInput) && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-white">📊 Sử dụng AI hôm nay</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Đã sử dụng:</span>
                  <span className="text-sm font-medium text-white">
                    {usageStats.dailyCount} / {usageStats.limit}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (usageStats.dailyCount / usageStats.limit) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Còn lại: <span className="font-medium text-slate-300">{usageStats.remaining}</span> lần sử dụng
                  {usageStats.remaining === 0 && (
                    <span className="ml-2 text-yellow-400">⚠️ Đã đạt giới hạn, sẽ reset vào ngày mai</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  Giới hạn: {usageStats.limit} lần/ngày (Groq free tier: 14,400/ngày)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Theme */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            {settings.theme === 'dark' ? (
              <Moon className="h-5 w-5 text-slate-400" />
            ) : (
              <Sun className="h-5 w-5 text-slate-400" />
            )}
            <p className="text-sm font-medium text-slate-300">Giao diện</p>
          </div>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="dark">Nền tối</option>
            <option value="light">Nền sáng</option>
          </select>
          <p className="mt-2 text-xs text-slate-500">
            {settings.theme === 'dark' ? 'Giao diện tối (mặc định)' : 'Giao diện sáng'}
          </p>
        </div>

        {/* Currency */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="h-5 w-5 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">Tiền tệ</p>
          </div>
          <select
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="VND">VND (Việt Nam Đồng)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="JPY">JPY (Japanese Yen)</option>
          </select>
          <p className="mt-2 text-xs text-slate-500">Đơn vị tiền tệ cho giao dịch</p>
        </div>

        {/* Language */}
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="h-5 w-5 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">Ngôn ngữ</p>
          </div>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            <option value="Tiếng Việt">Tiếng Việt</option>
            <option value="English">English</option>
            <option value="中文">中文</option>
          </select>
          <p className="mt-2 text-xs text-slate-500">Ngôn ngữ hiển thị (sẽ cập nhật sau)</p>
        </div>

        {/* Placeholder for future settings */}
        <div className="card opacity-50">
          <p className="text-sm text-slate-400">Cài đặt khác</p>
          <p className="mt-2 text-sm text-slate-500">Sẽ được thêm sau...</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang lưu...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Lưu cài đặt
            </>
          )}
        </button>
      </div>

      <div className="card">
        <h3 className="mb-2 text-lg font-semibold text-white">Privacy</h3>
        <p className="text-sm text-slate-400">
          Local-only mode. Tất cả dữ liệu được lưu trữ cục bộ trên máy của bạn.
          API key được lưu trong database local, không gửi đi đâu.
        </p>
      </div>
    </div>
  );
}
