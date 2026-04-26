import { useState } from 'react';
import { Bell, Settings, LogOut, X, Megaphone, ChevronRight, GraduationCap, Circle, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements, useUnreadCount, useMarkAsRead } from '../../hooks/useAnnouncements';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';

export default function Header({ title = 'Dashboard' }: { title?: string }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: announcements = [] } = useAnnouncements();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: settings } = useSchoolSettings();
  const markAsRead = useMarkAsRead();

  // Get recent announcements (last 7 days)
  const recentAnnouncements = announcements
    .filter(a => {
      const date = new Date(a.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    })
    .slice(0, 5);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }, 500);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleAnnouncementClick = (announcement: any) => {
    if (!announcement.isRead) {
      markAsRead.mutate(announcement.id);
    }
    navigate('/announcements');
    setShowAnnouncements(false);
  };

  const schoolName = settings?.schoolName || 'School Management System';
  const schoolLogo = settings?.schoolLogo;
  
  // Build full logo URL
  const logoUrl = schoolLogo 
    ? (schoolLogo.startsWith('http') 
        ? schoolLogo 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${schoolLogo}`)
    : null;

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        {/* Left side - Logo and School Name */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="School Logo" 
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.innerHTML = `<svg class="w-5 h-5 text-[#1a3d30]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
                  parent.prepend(icon.firstChild as Node);
                }
              }}
            />
          ) : (
            <GraduationCap className="w-5 h-5 text-[#1a3d30]" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 text-sm leading-tight">{schoolName}</span>
            {title !== 'Dashboard' && (
              <span className="text-xs text-gray-400 leading-tight">{title}</span>
            )}
          </div>
        </div>

        {/* Right side - Actions (No tab names) */}
        <div className="flex items-center gap-1 relative">
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowAnnouncements(!showAnnouncements)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Announcements Dropdown */}
            {showAnnouncements && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowAnnouncements(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#1a3d30]/5 to-transparent">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-[#1a3d30]" />
                      <h3 className="font-medium text-gray-900 text-sm">Recent Announcements</h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowAnnouncements(false)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {recentAnnouncements.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No new announcements</p>
                      </div>
                    ) : (
                      recentAnnouncements.map((announcement) => (
                        <div 
                          key={announcement.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                            !announcement.isRead ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleAnnouncementClick(announcement)}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-1.5 mt-1">
                              {!announcement.isRead ? (
                                <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500 flex-shrink-0" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              )}
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                announcement.priority === 'HIGH' ? 'bg-red-500' :
                                announcement.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!announcement.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {announcement.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {announcement.content}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(announcement.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                    <button
                      onClick={() => {
                        navigate('/announcements');
                        setShowAnnouncements(false);
                      }}
                      className="w-full flex items-center justify-center gap-1 text-xs text-[#1a3d30] hover:bg-gray-100 py-2 rounded-lg transition-colors font-medium"
                    >
                      View All Announcements
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-gray-200 mx-2" />
          
          {/* Logout Button */}
          <button 
            onClick={handleLogoutClick}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm text-gray-600 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:scale-105" />
            <span className="group-hover:font-medium">Logout</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={handleCancelLogout}
          />
          
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="relative p-6 pb-4 text-center">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={handleCancelLogout}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Logout Confirmation</h3>
                
                <p className="text-gray-600 text-sm">
                  Are you sure you want to log out of your account?
                </p>
                
                {user && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Logged in as</p>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">Role: {user.role?.toLowerCase()}</p>
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>You'll need to login again to access your account</span>
                </div>
              </div>
              
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Yes, Logout
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}