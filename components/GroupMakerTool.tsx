'use client';
import { useState, useRef, useEffect } from 'react';

type Child = {
  id: number;
  name: string;
  gender: string;
  friends: string[];
  keepApart: string[];
};

type Group = {
  id: number;
  children: Child[];
  targetSize: number;
};

export default function GroupMakerTool() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('boy');
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [numGroups, setNumGroups] = useState(3);
  const [groupSizes, setGroupSizes] = useState<number[]>([4, 4, 4]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportFileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [friendLimit, setFriendLimit] = useState(3);
  const [keepApartLimit, setKeepApartLimit] = useState(2);
  const [unlimitedFriends, setUnlimitedFriends] = useState(false);
  const [unlimitedKeepApart, setUnlimitedKeepApart] = useState(false);
  const [balanceByGender, setBalanceByGender] = useState(true);
  const [genderGrouping, setGenderGrouping] = useState<'mixed' | 'boys-only' | 'girls-only'>('mixed');

  // Friend priority system
  const [friendPriorities, setFriendPriorities] = useState<{[key: string]: number}>({});
  const [mustBeTogether, setMustBeTogether] = useState<{[key: string]: string[]}>({});

  // Child editing
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreImportModal, setShowPreImportModal] = useState(false);
  const [preImportChildren, setPreImportChildren] = useState<Child[]>([]);

  // Client-side mounting check
  const [mounted, setMounted] = useState(false);

  // Ref for scrolling to groups
  const groupsRef = useRef<HTMLDivElement>(null);

  // Load saved data on component mount
  useEffect(() => {
    const savedChildren = localStorage.getItem('groupMakerChildren');
    const savedSettings = localStorage.getItem('groupMakerSettings');
    
    if (savedChildren) {
      try {
        const loadedChildren = JSON.parse(savedChildren) as Child[];
        setChildren(loadedChildren);
      } catch {
        console.error('Error loading saved children');
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setFriendPriorities(settings.friendPriorities || {});
        setMustBeTogether(settings.mustBeTogether || {});
        setFriendLimit(settings.friendLimit || 3);
        setKeepApartLimit(settings.keepApartLimit || 2);
        setUnlimitedFriends(settings.unlimitedFriends || false);
        setUnlimitedKeepApart(settings.unlimitedKeepApart || false);
        setBalanceByGender(settings.balanceByGender !== false);
        setGenderGrouping(settings.genderGrouping || 'mixed');
      } catch {
        console.error('Error loading saved settings');
      }
    }
    setMounted(true);
  }, []);

  // Save data
  useEffect(() => {
    if (children.length > 0) {
      localStorage.setItem('groupMakerChildren', JSON.stringify(children));
    }
  }, [children]);

  useEffect(() => {
    const settings = {
      friendPriorities,
      mustBeTogether,
      friendLimit,
      keepApartLimit,
      unlimitedFriends,
      unlimitedKeepApart,
      balanceByGender,
      genderGrouping
    };
    localStorage.setItem('groupMakerSettings', JSON.stringify(settings));
  }, [friendPriorities, mustBeTogether, friendLimit, keepApartLimit, unlimitedFriends, unlimitedKeepApart, balanceByGender, genderGrouping]);

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <h1 className="text-3xl font-bold text-green-600 mb-6">Group Maker</h1>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all children? This cannot be undone.')) {
      setChildren([]);
      setGroups([]);
      setFriendPriorities({});
      setMustBeTogether({});
      localStorage.removeItem('groupMakerChildren');
      localStorage.removeItem('groupMakerSettings');
    }
  };

  const downloadChildrenData = () => {
    const dataStr = JSON.stringify({
      children,
      settings: {
        friendPriorities,
        mustBeTogether,
        friendLimit,
        keepApartLimit,
        unlimitedFriends,
        unlimitedKeepApart,
        balanceByGender,
        genderGrouping
      }
    }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'group-maker-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const uploadChildrenData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (Array.isArray(jsonData)) {
          setChildren(jsonData);
          alert('Children data loaded successfully!');
        } else if (jsonData.children) {
          setChildren(jsonData.children);
          if (jsonData.settings) {
            const settings = jsonData.settings;
            setFriendPriorities(settings.friendPriorities || {});
            setMustBeTogether(settings.mustBeTogether || {});
            setFriendLimit(settings.friendLimit || 3);
            setKeepApartLimit(settings.keepApartLimit || 2);
            setUnlimitedFriends(settings.unlimitedFriends || false);
            setUnlimitedKeepApart(settings.unlimitedKeepApart || false);
            setBalanceByGender(settings.balanceByGender !== false);
            setGenderGrouping(settings.genderGrouping || 'mixed');
          }
          alert('Children data and settings loaded successfully!');
        } else {
          alert('Invalid file format.');
        }
      } catch {
        alert('Error reading file.');
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const detectGender = (name: string) => {
    const maleNames = ['noah', 'kieran', 'edward', 'owen', 'drew', 'beau', 'eoin', 'euan', 'lorenzo', 'rory', 'cian', 'patryk', 'james', 'john', 'michael', 'william', 'david'];
    const femaleNames = ['charlotte', 'ellie', 'connie', 'elisa', 'sadie', 'christy', 'aoife', 'beatrix', 'dolly', 'lilly', 'orlaith', 'caoimhe', 'evelyn', 'darcie', 'esme', 'mary', 'patricia'];
    
    const firstName = name.toLowerCase().split(' ')[0];
    
    if (maleNames.includes(firstName)) return 'boy';
    if (femaleNames.includes(firstName)) return 'girl';
    return null;
  };

  const validateChildName = (name: string): string | null => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return 'Name cannot be empty';
    if (trimmedName.length > 50) return 'Name is too long';
    if (children.some(child => child.name.toLowerCase() === trimmedName.toLowerCase())) {
      return 'A child with this name already exists';
    }
    return null;
  };

  const addChild = () => {
    const validationError = validateChildName(name);
    if (validationError) {
      alert(validationError);
      return;
    }

    const newChild = {
      id: Date.now(),
      name: name.trim(),
      gender: gender,
      friends: [],
      keepApart: []
    };
    setChildren([...children, newChild]);
    setName('');
  };

  const removeChild = (id: number) => {
    if (confirm('Are you sure you want to remove this child?')) {
      const childToRemove = children.find(c => c.id === id);
      if (childToRemove) {
        setChildren(prev => prev
          .filter(child => child.id !== id)
          .map(child => ({
            ...child,
            friends: child.friends.filter(f => f !== childToRemove.name),
            keepApart: child.keepApart.filter(k => k !== childToRemove.name)
          }))
        );
      }
    }
  };

  const addFriend = (childId: number, friendName: string) => {
    if (!friendName.trim()) return;
    
    setChildren(children.map(child => {
      if (child.id === childId) {
        const maxFriends = unlimitedFriends ? 999 : friendLimit;
        if (child.friends.length < maxFriends && !child.friends.includes(friendName)) {
          return { ...child, friends: [...child.friends, friendName] };
        }
      }
      return child;
    }));
  };

  const removeFriend = (childId: number, friendName: string) => {
    setChildren(children.map(child => 
      child.id === childId 
        ? { ...child, friends: child.friends.filter(f => f !== friendName) }
        : child
    ));
  };

  const addKeepApart = (childId: number, personName: string) => {
    if (!personName.trim()) return;
    
    setChildren(children.map(child => {
      if (child.id === childId) {
        const maxKeepApart = unlimitedKeepApart ? 999 : keepApartLimit;
        if (child.keepApart.length < maxKeepApart && !child.keepApart.includes(personName)) {
          return { ...child, keepApart: [...child.keepApart, personName] };
        }
      }
      return child;
    }));
  };

  const removeKeepApart = (childId: number, personName: string) => {
    setChildren(children.map(child => 
      child.id === childId 
        ? { ...child, keepApart: child.keepApart.filter(p => p !== personName) }
        : child
    ));
  };

  const setFriendPriority = (childId: number, friendName: string, priority: number) => {
    const key = `${childId}-${friendName}`;
    setFriendPriorities(prev => ({
      ...prev,
      [key]: priority
    }));
  };

  const toggleMustBeTogether = (childId: number, friendName: string, mustBe: boolean) => {
    setMustBeTogether(prev => {
      const childKey = childId.toString();
      const currentMustBe = prev[childKey] || [];
      
      if (mustBe && !currentMustBe.includes(friendName)) {
        return {
          ...prev,
          [childKey]: [...currentMustBe, friendName]
        };
      } else if (!mustBe) {
        return {
          ...prev,
          [childKey]: currentMustBe.filter(name => name !== friendName)
        };
      }
      return prev;
    });
  };

  const getFriendPriority = (childId: number, friendName: string): number => {
    const key = `${childId}-${friendName}`;
    return friendPriorities[key] || 1;
  };

  const isMustBeTogether = (childId: number, friendName: string): boolean => {
    const childKey = childId.toString();
    return mustBeTogether[childKey]?.includes(friendName) || false;
  };

  const updateNumGroups = (newNumGroups: number) => {
    setNumGroups(newNumGroups);
    const newSizes = Array(newNumGroups).fill(4);
    for (let i = 0; i < Math.min(newNumGroups, groupSizes.length); i++) {
      newSizes[i] = groupSizes[i];
    }
    setGroupSizes(newSizes);
  };

  const updateGroupSize = (groupIndex: number, size: number) => {
    const newSizes = [...groupSizes];
    newSizes[groupIndex] = size;
    setGroupSizes(newSizes);
  };

  const updateChild = (updatedChild: Child) => {
    setChildren(children.map(child => 
      child.id === updatedChild.id ? updatedChild : child
    ));
    setEditingChild(null);
    setShowEditModal(false);
  };

  const startEditChild = (child: Child) => {
    setEditingChild({ ...child });
    setShowEditModal(true);
  };

  const generateGroups = () => {
    if (children.length === 0) {
      alert('Please add some children first.');
      return;
    }

    const newGroups: Group[] = [];
    
    // Initialize empty groups
    for (let i = 0; i < numGroups; i++) {
      newGroups.push({
        id: i,
        children: [],
        targetSize: groupSizes[i]
      });
    }

    const remainingChildren = [...children];

    // Simple distribution for now
    let currentGroup = 0;
    while (remainingChildren.length > 0) {
      const child = remainingChildren.shift()!;
      
      if (newGroups[currentGroup].children.length < newGroups[currentGroup].targetSize) {
        newGroups[currentGroup].children.push(child);
      } else {
        currentGroup = (currentGroup + 1) % numGroups;
        newGroups[currentGroup].children.push(child);
      }
    }

    setGroups(newGroups);
    alert('Groups generated successfully!');
    
    // Scroll to groups section after a brief delay to allow the DOM to update
    setTimeout(() => {
      groupsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const getTotalTargetSize = () => {
    return groupSizes.reduce((sum, size) => sum + size, 0);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const lines = csvContent.split('\n');
      const parsedChildren: Child[] = [];

      lines.forEach((line, index) => {
        if (line.trim() && index > 0) {
          const parts = line.split(',').map(part => part.trim().replace(/['"]/g, ''));
          const name = parts[0];
          
          if (name && validateChildName(name) === null) {
            let childGender = null;
            
            if (parts[1] && (parts[1].toLowerCase() === 'girl' || parts[1].toLowerCase() === 'boy')) {
              childGender = parts[1].toLowerCase();
            } else {
              childGender = detectGender(name);
            }

            parsedChildren.push({
              id: Date.now() + index + Math.random(),
              name: name,
              gender: (childGender as 'boy' | 'girl') || 'boy',
              friends: [],
              keepApart: []
            });
          }
        }
      });

      if (parsedChildren.length === 0) {
        alert('No valid children found in CSV.');
        return;
      }

      setPreImportChildren(parsedChildren);
      setShowPreImportModal(true);
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const confirmPreImport = () => {
    setChildren(prev => [...prev, ...preImportChildren]);
    setPreImportChildren([]);
    setShowPreImportModal(false);
    alert(`Added ${preImportChildren.length} children successfully!`);
  };

  const updatePreImportChildGender = (childId: number, newGender: 'boy' | 'girl') => {
    setPreImportChildren(prev => prev.map(child => 
      child.id === childId ? { ...child, gender: newGender } : child
    ));
  };

  const exportGroupsAsCSV = () => {
    if (groups.length === 0) {
      alert('Please generate groups first.');
      return;
    }

    let csvContent = 'Group,Child Name,Gender\n';
    groups.forEach((group, groupIndex) => {
      group.children.forEach(child => {
        csvContent += `Group ${groupIndex + 1},${child.name},${child.gender}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'group-assignments.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-600">Group Maker</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadChildrenData}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            disabled={children.length === 0}
          >
            💾 Save Data
          </button>
          <button
            onClick={() => exportFileInputRef.current?.click()}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            📁 Load Data
          </button>
          <button
            onClick={clearAllData}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            disabled={children.length === 0}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      <input
        ref={exportFileInputRef}
        type="file"
        accept=".json"
        onChange={uploadChildrenData}
        className="hidden"
      />
      
      {/* Edit Child Modal */}
      {showEditModal && editingChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Edit Child</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={editingChild.name}
                  onChange={(e) => setEditingChild({...editingChild, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="edit-gender"
                      value="boy"
                      checked={editingChild.gender === 'boy'}
                      onChange={(e) => setEditingChild({...editingChild, gender: e.target.value})}
                      className="mr-2"
                    />
                    Boy
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="edit-gender"
                      value="girl"
                      checked={editingChild.gender === 'girl'}
                      onChange={(e) => setEditingChild({...editingChild, gender: e.target.value})}
                      className="mr-2"
                    />
                    Girl
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => updateChild(editingChild)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Import Review Modal */}
      {showPreImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Review Import - Check Genders</h3>
            <p className="text-gray-600 mb-4">
              Please review the imported children and correct any gender assignments.
            </p>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {preImportChildren.map((child) => {
                const wasAutoDetected = !detectGender(child.name);
                return (
                  <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.name}</span>
                      {wasAutoDetected && <span className="text-orange-500">⚠️</span>}
                    </div>
                    <div className="flex gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`pre-gender-${child.id}`}
                          value="boy"
                          checked={child.gender === 'boy'}
                          onChange={() => updatePreImportChildGender(child.id, 'boy')}
                          className="mr-2"
                        />
                        Boy
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`pre-gender-${child.id}`}
                          value="girl"
                          checked={child.gender === 'girl'}
                          onChange={() => updatePreImportChildGender(child.id, 'girl')}
                          className="mr-2"
                        />
                        Girl
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreImportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel Import
              </button>
              <button
                onClick={confirmPreImport}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Import {preImportChildren.length} Children
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h2 className="text-xl font-semibold mb-4">⚙️ Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div>
            <h3 className="font-medium mb-3">👥 Friends Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={unlimitedFriends}
                  onChange={(e) => setUnlimitedFriends(e.target.checked)}
                  className="mr-2"
                />
                Unlimited friends
              </label>
              {!unlimitedFriends && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Maximum friends per child: {friendLimit}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={friendLimit}
                    onChange={(e) => setFriendLimit(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">⚠️ Keep Apart Settings</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={unlimitedKeepApart}
                  onChange={(e) => setUnlimitedKeepApart(e.target.checked)}
                  className="mr-2"
                />
                Unlimited keep-apart
              </label>
              {!unlimitedKeepApart && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Maximum keep-apart per child: {keepApartLimit}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={keepApartLimit}
                    onChange={(e) => setKeepApartLimit(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">⚖️ Group Composition</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Group Type</label>
                <select
                  value={genderGrouping}
                  onChange={(e) => setGenderGrouping(e.target.value as 'mixed' | 'boys-only' | 'girls-only')}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="mixed">Mixed groups (boys & girls)</option>
                  <option value="boys-only">Boys only groups</option>
                  <option value="girls-only">Girls only groups</option>
                </select>
              </div>
              
              {genderGrouping === 'mixed' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={balanceByGender}
                    onChange={(e) => setBalanceByGender(e.target.checked)}
                    className="mr-2"
                  />
                  Balance groups by gender
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSV Upload Section */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="text-xl font-semibold mb-4">📂 Upload CSV</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📤 Upload CSV File
          </button>
          <div className="text-sm text-gray-600">
            <p><strong>CSV format:</strong> Name,Gender OR just Name</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="hidden"
        />
      </div>
      
      {/* Individual Child Addition */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold mb-4">➕ Add Individual Child</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter child's name"
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={addChild}
              disabled={!name.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Add Child
            </button>
          </div>
        </div>
      </div>

      {/* Group Configuration */}
      {children.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h2 className="text-xl font-semibold mb-4">🎯 Configure Groups</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Groups: {numGroups}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={numGroups}
                onChange={(e) => updateNumGroups(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <p className="text-sm text-gray-600">
                <strong>Total children:</strong> {children.length}<br/>
                <strong>Total group capacity:</strong> {getTotalTargetSize()}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-3">Group Sizes:</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Array.from({ length: numGroups }, (_, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-1">Group {i + 1}</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={groupSizes[i] || 4}
                    onChange={(e) => updateGroupSize(i, parseInt(e.target.value) || 4)}
                    className="w-full p-2 border rounded text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={generateGroups}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              disabled={children.length === 0}
            >
              🎲 Generate Groups
            </button>
          </div>
        </div>
      )}

      {/* Children List */}
      {children.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">👶 Children List ({children.length})</h2>
            <div className="text-sm text-gray-600">
              Boys: {children.filter(c => c.gender === 'boy').length} | 
              Girls: {children.filter(c => c.gender === 'girl').length}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-white rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {child.name} {child.gender === 'boy' ? '👦' : '👧'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditChild(child)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                      title="Edit child"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeChild(child.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Remove child"
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Friends Section */}
                <div className="mb-3">
                  <h4 className="font-medium text-sm mb-2 text-green-600">👥 Friends:</h4>
                  {child.friends.length > 0 ? (
                    <div className="space-y-1">
                      {child.friends.map((friendName, index) => {
                        const priority = getFriendPriority(child.id, friendName);
                        const mustBe = isMustBeTogether(child.id, friendName);
                        return (
                          <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span>{friendName}</span>
                              <div className="flex gap-1">
                                {[1, 2, 3].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setFriendPriority(child.id, friendName, p)}
                                    className={`w-4 h-4 rounded text-xs ${
                                      priority >= p ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                    }`}
                                    title={`Priority ${p}`}
                                  >
                                    ⭐
                                  </button>
                                ))}
                                <button
                                  onClick={() => toggleMustBeTogether(child.id, friendName, !mustBe)}
                                  className={`w-4 h-4 rounded text-xs ${
                                    mustBe ? 'bg-red-500 text-white' : 'bg-gray-200'
                                  }`}
                                  title="Must be together"
                                >
                                  🔒
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFriend(child.id, friendName)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove friend"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No friends added</p>
                  )}
                  
                  {(!unlimitedFriends && child.friends.length < friendLimit) || unlimitedFriends ? (
                    <div className="mt-2 flex gap-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addFriend(child.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-xs p-1 border rounded flex-1"
                      >
                        <option value="">Add friend...</option>
                        {children
                          .filter(c => c.id !== child.id && !child.friends.includes(c.name))
                          .map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                      </select>
                    </div>
                  ) : null}
                </div>

                {/* Keep Apart Section */}
                <div>
                  <h4 className="font-medium text-sm mb-2 text-red-600">⚠️ Keep Apart:</h4>
                  {child.keepApart.length > 0 ? (
                    <div className="space-y-1">
                      {child.keepApart.map((personName, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded">
                          <span>{personName}</span>
                          <button
                            onClick={() => removeKeepApart(child.id, personName)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove keep apart"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No keep-apart rules</p>
                  )}
                  
                  {(!unlimitedKeepApart && child.keepApart.length < keepApartLimit) || unlimitedKeepApart ? (
                    <div className="mt-2 flex gap-1">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addKeepApart(child.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="text-xs p-1 border rounded flex-1"
                      >
                        <option value="">Add keep apart...</option>
                        {children
                          .filter(c => c.id !== child.id && !child.keepApart.includes(c.name))
                          .map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Groups Display */}
      {groups.length > 0 && (
        <div ref={groupsRef} className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-700">🎯 Generated Groups</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={exportGroupsAsCSV}
                className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                📊 Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, groupIndex) => {
              const boys = group.children.filter(c => c.gender === 'boy').length;
              const girls = group.children.filter(c => c.gender === 'girl').length;
              
              return (
                <div key={group.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Group {groupIndex + 1}</h3>
                    <div className="text-sm text-gray-600">
                      {group.children.length}/{group.targetSize} ({boys}B/{girls}G)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {group.children.map((child, childIndex) => (
                      <div key={child.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {childIndex + 1}. {child.name}
                          </span>
                          <span className="text-xs">
                            {child.gender === 'boy' ? '👦' : '👧'}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {group.children.length === 0 && (
                      <p className="text-gray-500 text-sm italic text-center py-4">Empty group</p>
                    )}
                  </div>
                  
                  {group.children.length < group.targetSize && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      {group.targetSize - group.children.length} spots remaining
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {children.length > 0 && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">📊 Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{children.length}</div>
              <div className="text-gray-600">Total Children</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {children.reduce((sum, child) => sum + child.friends.length, 0)}
              </div>
              <div className="text-gray-600">Friendships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {children.reduce((sum, child) => sum + child.keepApart.length, 0)}
              </div>
              <div className="text-gray-600">Keep-Apart Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(mustBeTogether).reduce((sum, arr) => sum + arr.length, 0)}
              </div>
              <div className="text-gray-600">Must-Be-Together</div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started Help */}
      {children.length === 0 && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🚀 Getting Started</h2>
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">1.</span>
              <div>
                <strong>Add children</strong> either individually using the form above, or upload a CSV file with names and optional genders.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">2.</span>
              <div>
                <strong>Set up relationships</strong> by adding friends and keep-apart rules for each child. Use priority levels (⭐⭐⭐) and must-be-together (🔒) for important relationships.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">3.</span>
              <div>
                <strong>Configure groups</strong> by setting the number of groups and their sizes based on your needs.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">4.</span>
              <div>
                <strong>Generate groups</strong> using the smart algorithm, then export results.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
