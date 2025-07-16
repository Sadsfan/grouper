'use client';
import { useState, useRef, useEffect } from 'react';

interface Child {
  id: number;
  name: string;
  gender: string;
  friends: string[];
  keepApart: string[];
}

interface Group {
  id: number;
  children: Child[];
  targetSize: number;
}

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

  // Child editing
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreImportModal, setShowPreImportModal] = useState(false);
  const [preImportChildren, setPreImportChildren] = useState<Child[]>([]);

  // Client-side mounting check
  const [mounted, setMounted] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedChildren = localStorage.getItem('groupMakerChildren');
        const savedSettings = localStorage.getItem('groupMakerSettings');
        
        if (savedChildren) {
          const loadedChildren = JSON.parse(savedChildren) as Child[];
          setChildren(loadedChildren);
        }

        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setFriendLimit(settings.friendLimit || 3);
          setKeepApartLimit(settings.keepApartLimit || 2);
          setUnlimitedFriends(settings.unlimitedFriends || false);
          setUnlimitedKeepApart(settings.unlimitedKeepApart || false);
          setBalanceByGender(settings.balanceByGender !== false);
          setGenderGrouping(settings.genderGrouping || 'mixed');
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
    setMounted(true);
  }, []);

  // Save data
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage && children.length > 0) {
      localStorage.setItem('groupMakerChildren', JSON.stringify(children));
    }
  }, [children]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const settings = {
        friendLimit,
        keepApartLimit,
        unlimitedFriends,
        unlimitedKeepApart,
        balanceByGender,
        genderGrouping
      };
      localStorage.setItem('groupMakerSettings', JSON.stringify(settings));
    }
  }, [friendLimit, keepApartLimit, unlimitedFriends, unlimitedKeepApart, balanceByGender, genderGrouping]);

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
    if (window.confirm('Are you sure you want to clear all children? This cannot be undone.')) {
      setChildren([]);
      setGroups([]);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('groupMakerChildren');
        localStorage.removeItem('groupMakerSettings');
      }
    }
  };

  const downloadChildrenData = () => {
    const dataStr = JSON.stringify({
      children,
      settings: {
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

    const newChild: Child = {
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
    if (window.confirm('Are you sure you want to remove this child?')) {
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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!name.trim()}
            >
              Add Child
            </button>
          </div>
        </div>
      </div>

      {/* Group Configuration */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h2 className="text-xl font-semibold mb-4">🎯 Group Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2">Number of Groups: {numGroups}</label>
            <input
              type="range"
              min="2"
              max="10"
              value={numGroups}
              onChange={(e) => updateNumGroups(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Target Size: {getTotalTargetSize()}</p>
            <p className="text-sm text-gray-600">Children Added: {children.length}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Group Sizes</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Array.from({ length: numGroups }, (_, i) => (
              <div key={i} className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">Group {i + 1}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={groupSizes[i] || 4}
                  onChange={(e) => updateGroupSize(i, parseInt(e.target.value) || 4)}
                  className="p-2 border rounded text-center"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 flex justify-center">
          <button
            onClick={generateGroups}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            disabled={children.length === 0}
          >
            🎲 Generate Groups
          </button>
        </div>
      </div>

      {/* Children List */}
      {children.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">👶 Children ({children.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div key={child.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{child.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditChild(child)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeChild(child.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {child.gender === 'boy' ? '👦' : '👧'} {child.gender}
                </p>
                
                {/* Friends */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Friends ({child.friends.length}/{unlimitedFriends ? '∞' : friendLimit})
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {child.friends.map((friend, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1"
                      >
                        {friend}
                        <button
                          onClick={() => removeFriend(child.id, friend)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {(unlimitedFriends || child.friends.length < friendLimit) && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addFriend(child.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">Add friend...</option>
                      {children
                        .filter(c => c.id !== child.id && !child.friends.includes(c.name))
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  )}
                </div>
                
                {/* Keep Apart */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Keep Apart ({child.keepApart.length}/{unlimitedKeepApart ? '∞' : keepApartLimit})
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {child.keepApart.map((person, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center gap-1"
                      >
                        {person}
                        <button
                          onClick={() => removeKeepApart(child.id, person)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {(unlimitedKeepApart || child.keepApart.length < keepApartLimit) && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addKeepApart(child.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">Add keep apart...</option>
                      {children
                        .filter(c => c.id !== child.id && !child.keepApart.includes(c.name))
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Groups */}
      {groups.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🎉 Generated Groups</h2>
            <button
              onClick={exportGroupsAsCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📄 Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <div key={group.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-lg mb-3 text-center">
                  Group {index + 1} ({group.children.length}/{group.targetSize})
                </h3>
                <div className="space-y-2">
                  {group.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="font-medium">{child.name}</span>
                      <span className="text-sm text-gray-600">
                        {child.gender === 'boy' ? '👦' : '👧'}
                      </span>
                    </div>
                  ))}
                </div>
                {group.children.length === 0 && (
                  <p className="text-gray-500 text-center italic">No children assigned</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-3">❓ How to Use</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1. Add Children:</strong> Upload a CSV file or add children individually</p>
          <p><strong>2. Set Preferences:</strong> Add friends and keep-apart preferences for each child</p>
          <p><strong>3. Configure Groups:</strong> Set the number of groups and their sizes</p>
          <p><strong>4. Generate:</strong> Click &quot;Generate Groups&quot; to create balanced groups</p>
          <p><strong>5. Export:</strong> Save your groups as a CSV file</p>
        </div>
      </div>
    </div>
  );
}
