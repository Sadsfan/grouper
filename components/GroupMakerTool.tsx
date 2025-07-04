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

type PendingChild = {
  id: number;
  name: string;
  gender: string;
};

export default function GroupMakerTool() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('boy');
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [numGroups, setNumGroups] = useState(3);
  const [groupSizes, setGroupSizes] = useState<number[]>([4, 4, 4]);
  const [pendingChildren, setPendingChildren] = useState<PendingChild[]>([]);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [editingChild, setEditingChild] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportFileInputRef = useRef<HTMLInputElement>(null);

  // Settings for friend/keep-apart limits
  const [friendLimit, setFriendLimit] = useState(3);
  const [keepApartLimit, setKeepApartLimit] = useState(2);
  const [unlimitedFriends, setUnlimitedFriends] = useState(false);
  const [unlimitedKeepApart, setUnlimitedKeepApart] = useState(false);

  // Client-side mounting check
  const [mounted, setMounted] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedChildren = localStorage.getItem('groupMakerChildren');
    if (savedChildren) {
      try {
        const loadedChildren = JSON.parse(savedChildren);
        const updatedChildren = loadedChildren.map((child: any) => ({
          ...child,
          keepApart: child.keepApart || []
        }));
        setChildren(updatedChildren);
      } catch {
        console.error('Error loading saved children');
      }
    }
  }, []);

  // Save children whenever the list changes
  useEffect(() => {
    if (children.length > 0) {
      localStorage.setItem('groupMakerChildren', JSON.stringify(children));
    }
  }, [children]);

  // Client mounting check
useEffect(() => {
  setMounted(true);
}, []);

// Prevent hydration errors - more reliable method
if (typeof window === 'undefined' || !mounted) {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <h1 className="text-3xl font-bold text-green-600 mb-6">Group Maker</h1>
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all children? This cannot be undone.')) {
      setChildren([]);
      setGroups([]);
      localStorage.removeItem('groupMakerChildren');
    }
  };

  const downloadChildrenData = () => {
    const dataStr = JSON.stringify(children, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'group-maker-children.json';
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
        if (Array.isArray(jsonData) && jsonData.every(child => child.name && child.gender)) {
          const updatedData = jsonData.map(child => ({
            ...child,
            keepApart: child.keepApart || []
          }));
          setChildren(updatedData);
          alert('Children data loaded successfully!');
        } else {
          alert('Invalid file format. Please upload a valid Group Maker JSON file.');
        }
      } catch {
        alert('Error reading file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const exportGroupsAsCSV = () => {
    if (groups.length === 0) {
      alert('Please generate groups first before exporting.');
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

  const exportGroupsAsText = () => {
    if (groups.length === 0) {
      alert('Please generate groups first before exporting.');
      return;
    }

    let textContent = 'GROUP ASSIGNMENTS\n';
    textContent += '='.repeat(50) + '\n\n';
    
    groups.forEach((group, index) => {
      textContent += `GROUP ${index + 1} (${group.children.length}/${group.targetSize}):\n`;
      textContent += '-'.repeat(30) + '\n';
      group.children.forEach((child, childIndex) => {
        textContent += `${childIndex + 1}. ${child.name} (${child.gender === 'boy' ? 'Boy' : 'Girl'})\n`;
      });
      textContent += '\n';
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'group-assignments.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyGroupsToClipboard = () => {
    if (groups.length === 0) {
      alert('Please generate groups first before copying.');
      return;
    }

    let textContent = 'GROUP ASSIGNMENTS\n';
    textContent += '='.repeat(30) + '\n\n';
    
    groups.forEach((group, index) => {
      textContent += `GROUP ${index + 1}:\n`;
      group.children.forEach((child, childIndex) => {
        textContent += `${childIndex + 1}. ${child.name} (${child.gender === 'boy' ? 'Boy' : 'Girl'})\n`;
      });
      textContent += '\n';
    });

    navigator.clipboard.writeText(textContent).then(() => {
      alert('Groups copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard. Please try the download option instead.');
    });
  };

  const detectGender = (name: string) => {
    const maleNames = ['noah', 'kieran', 'edward', 'owen', 'drew', 'beau', 'eoin', 'euan', 'lorenzo', 'rory', 'cian', 'patryk'];
    const femaleNames = ['charlotte', 'ellie', 'connie', 'elisa', 'sadie', 'christy', 'aoife', 'beatrix', 'dolly', 'lilly', 'orlaith', 'caoimhe', 'evelyn', 'darcie', 'esme'];
    
    const firstName = name.toLowerCase().split(' ')[0];
    
    if (maleNames.includes(firstName)) return 'boy';
    if (femaleNames.includes(firstName)) return 'girl';
    return null;
  };

  const addChild = () => {
    if (name.trim()) {
      const newChild = {
        id: Date.now(),
        name: name.trim(),
        gender: gender,
        friends: [],
        keepApart: []
      };
      setChildren([...children, newChild]);
      setName('');
    }
  };

  const removeChild = (id: number) => {
    setChildren(children.filter(child => child.id !== id));
  };

  const addFriend = (childId: number, friendName: string) => {
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

  const generateGroups = () => {
    if (children.length === 0) return;

    // Smart algorithm that considers friends and keep-apart relationships
    const remainingChildren = [...children];
    const newGroups: Group[] = [];
    
    // Initialize empty groups
    for (let i = 0; i < numGroups; i++) {
      newGroups.push({
        id: i,
        children: [],
        targetSize: groupSizes[i]
      });
    }

    // Helper function to check if two children should be kept apart
    const shouldKeepApart = (child1: Child, child2: Child) => {
      return child1.keepApart.includes(child2.name) || child2.keepApart.includes(child1.name);
    };

    // Helper function to check if two children are friends
    const areFriends = (child1: Child, child2: Child) => {
      return child1.friends.includes(child2.name) || child2.friends.includes(child1.name);
    };

    // Helper function to find the best group for a child
    const findBestGroupForChild = (child: Child) => {
      let bestGroup = -1;
      let bestScore = -1000;

      for (let groupIndex = 0; groupIndex < newGroups.length; groupIndex++) {
        const group = newGroups[groupIndex];
        
        // Skip if group is full
        if (group.children.length >= group.targetSize) continue;

        let score = 0;
        let canPlace = true;

        // Check each child in the group
        for (const groupChild of group.children) {
          // Cannot place if they should be kept apart
          if (shouldKeepApart(child, groupChild)) {
            canPlace = false;
            break;
          }
          
          // Bonus points for friends
          if (areFriends(child, groupChild)) {
            score += 100;
          }
        }

        if (!canPlace) continue;

        // Prefer groups with more space relative to target
        const spacePenalty = (group.children.length / group.targetSize) * 10;
        score -= spacePenalty;

        if (score > bestScore) {
          bestScore = score;
          bestGroup = groupIndex;
        }
      }

      return bestGroup;
    };

    // Phase 1: Place children with friends first (prioritize friend groups)
    const childrenWithFriends = remainingChildren.filter(child => child.friends.length > 0);
    childrenWithFriends.sort((a, b) => b.friends.length - a.friends.length); // Most friends first

    for (const child of childrenWithFriends) {
      if (!remainingChildren.includes(child)) continue; // Already placed

      const bestGroupIndex = findBestGroupForChild(child);
      if (bestGroupIndex !== -1) {
        newGroups[bestGroupIndex].children.push(child);
        remainingChildren.splice(remainingChildren.indexOf(child), 1);
      }
    }

    // Phase 2: Place remaining children
    while (remainingChildren.length > 0) {
      const child = remainingChildren[0];
      const bestGroupIndex = findBestGroupForChild(child);
      
      if (bestGroupIndex !== -1) {
        newGroups[bestGroupIndex].children.push(child);
      } else {
        // Force placement in least full group if no good match
        const leastFullGroup = newGroups.reduce((min, group, index) => 
          group.children.length < newGroups[min].children.length ? index : min, 0);
        newGroups[leastFullGroup].children.push(child);
      }
      
      remainingChildren.shift();
    }

    setGroups(newGroups);
    
    // Show a summary of friend connections
    let totalFriendConnections = 0;
    let totalKeepApartViolations = 0;
    
    newGroups.forEach(group => {
      for (let i = 0; i < group.children.length; i++) {
        for (let j = i + 1; j < group.children.length; j++) {
          if (areFriends(group.children[i], group.children[j])) {
            totalFriendConnections++;
          }
          if (shouldKeepApart(group.children[i], group.children[j])) {
            totalKeepApartViolations++;
          }
        }
      }
    });
    
    setTimeout(() => {
      alert(`Groups generated! Friend connections: ${totalFriendConnections}, Keep-apart violations: ${totalKeepApartViolations}`);
    }, 100);
  };

  const getTotalTargetSize = () => {
    return groupSizes.reduce((sum, size) => sum + size, 0);
  };

  const updatePendingGender = (id: number, newGender: string) => {
    setPendingChildren(prev => prev.map(child => 
      child.id === id ? { ...child, gender: newGender } : child
    ));
  };

  const confirmGenderAssignments = () => {
    const newChildren = pendingChildren.map(pending => ({
      ...pending,
      friends: [],
      keepApart: []
    }));
    setChildren(prev => [...prev, ...newChildren]);
    setPendingChildren([]);
    setShowGenderModal(false);
  };

  const cancelGenderAssignment = () => {
    setPendingChildren([]);
    setShowGenderModal(false);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const lines = csvContent.split('\n');
      const newChildren: Child[] = [];
      const needsGenderAssignment: PendingChild[] = [];

      lines.forEach((line, index) => {
        if (line.trim() && index > 0) {
          const parts = line.split(',').map(part => part.trim());
          const name = parts[0];
          
          if (name) {
            let childGender = null;
            
            if (parts[1] && (parts[1].toLowerCase() === 'girl' || parts[1].toLowerCase() === 'boy')) {
              childGender = parts[1].toLowerCase();
            } else {
              childGender = detectGender(name);
            }

            if (childGender) {
              newChildren.push({
                id: Date.now() + index,
                name: name,
                gender: childGender,
                friends: [],
                keepApart: []
              });
            } else {
              needsGenderAssignment.push({
                id: Date.now() + index,
                name: name,
                gender: 'boy'
              });
            }
          }
        }
      });

      if (newChildren.length > 0) {
        setChildren(prev => [...prev, ...newChildren]);
      }

      if (needsGenderAssignment.length > 0) {
        setPendingChildren(needsGenderAssignment);
        setShowGenderModal(true);
      }

      alert(`Added ${newChildren.length} children automatically. ${needsGenderAssignment.length} need gender assignment.`);
    };

    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-600">Group Maker</h1>
        <div className="flex gap-4">
          <button
            onClick={downloadChildrenData}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            disabled={children.length === 0}
          >
            💾 Save Data
          </button>
          <button
            onClick={() => exportFileInputRef.current?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            📁 Load Data
          </button>
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
      
      {/* Gender Assignment Modal */}
      {showGenderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Assign Genders</h3>
            <p className="text-gray-600 mb-4">
              These names couldn&apos;t be automatically identified. Please assign genders:
            </p>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {pendingChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{child.name}</span>
                  <div className="flex gap-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`gender-${child.id}`}
                        value="boy"
                        checked={child.gender === 'boy'}
                        onChange={() => updatePendingGender(child.id, 'boy')}
                        className="mr-2"
                      />
                      Boy
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`gender-${child.id}`}
                        value="girl"
                        checked={child.gender === 'girl'}
                        onChange={() => updatePendingGender(child.id, 'girl')}
                        className="mr-2"
                      />
                      Girl
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelGenderAssignment}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenderAssignments}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add All Children
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h2 className="text-xl font-semibold mb-4">Relationship Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <h3 className="font-medium mb-3">Friends Settings</h3>
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
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Keep Apart Settings</h3>
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
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Upload CSV</h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Upload CSV File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="hidden"
        />
        <p className="text-sm text-gray-600 mt-2">
          CSV format: Name,Gender OR just Name (gender will be auto-detected or you&apos;ll be asked)
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add Individual Child</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Add Child
            </button>
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Configure Groups</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Number of Groups</label>
            <input 
              type="number" 
              value={numGroups} 
              onChange={(e) => updateNumGroups(parseInt(e.target.value) || 1)}
              min="1"
              max="15"
              className="p-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Individual Group Sizes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: numGroups }, (_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <label className="text-sm font-medium">Group {index + 1}:</label>
                  <input 
                    type="number" 
                    value={groupSizes[index] || 4} 
                    onChange={(e) => updateGroupSize(index, parseInt(e.target.value) || 1)}
                    min="1"
                    max="20"
                    className="w-16 p-1 border rounded text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 p-3 bg-white rounded border">
            <div className="text-sm text-gray-600">
              <strong>Summary:</strong> {numGroups} groups, total capacity: {getTotalTargetSize()} children
              {children.length > getTotalTargetSize() && (
                <span className="text-orange-600 ml-2">
                  ({children.length - getTotalTargetSize()} children will be distributed among groups)
                </span>
              )}
              {children.length < getTotalTargetSize() && (
                <span className="text-blue-600 ml-2">
                  ({getTotalTargetSize() - children.length} spots remaining)
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={generateGroups}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Generate Groups
          </button>
        </div>
      )}

      {children.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Children ({children.length}) - Auto-saved ✅
            <span className="text-sm font-normal text-gray-600 ml-2">
              Friends: {unlimitedFriends ? 'Unlimited' : friendLimit} | Keep Apart: {unlimitedKeepApart ? 'Unlimited' : keepApartLimit}
            </span>
          </h3>
          <div className="space-y-4">
            {children.map((child, index) => (
              <div key={child.id} className="p-3 bg-white rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{index + 1}. {child.name} ({child.gender === 'boy' ? '👦 Boy' : '👧 Girl'})</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingChild(editingChild === child.id ? null : child.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                    >
                      {editingChild === child.id ? 'Done' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => removeChild(child.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {child.friends.length > 0 && (
                  <div className="text-sm text-blue-600 mb-2">
                    <span className="font-medium">Friends: </span>
                    {child.friends.map((friend, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 mr-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {friend}
                          {editingChild === child.id && (
                            <button
                              onClick={() => removeFriend(child.id, friend)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {child.keepApart && child.keepApart.length > 0 && (
                  <div className="text-sm text-red-600 mb-2">
                    <span className="font-medium">Keep Apart: </span>
                    {child.keepApart.map((person, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 mr-2">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                          {person}
                          {editingChild === child.id && (
                            <button
                              onClick={() => removeKeepApart(child.id, person)}
                              className="ml-1 text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4 text-sm">
                  <div>
                    <label>Add friend:</label>
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          addFriend(child.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="ml-2 p-1 border rounded text-sm"
                      disabled={!unlimitedFriends && child.friends.length >= friendLimit}
                    >
                      <option value="">Select friend...</option>
                      {children
                        .filter(c => c.id !== child.id && !child.friends.includes(c.name))
                        .map(otherChild => (
                          <option key={otherChild.id} value={otherChild.name}>
                            {otherChild.name}
                          </option>
                        ))
                      }
                    </select>
                    <span className="ml-2 text-xs text-gray-500">
                      ({child.friends.length}/{unlimitedFriends ? '∞' : friendLimit})
                    </span>
                  </div>

                  <div>
                    <label>Keep apart:</label>
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          addKeepApart(child.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="ml-2 p-1 border rounded text-sm"
                      disabled={!unlimitedKeepApart && child.keepApart.length >= keepApartLimit}
                    >
                      <option value="">Select person...</option>
                      {children
                        .filter(c => c.id !== child.id && !child.keepApart.includes(c.name))
                        .map(otherChild => (
                          <option key={otherChild.id} value={otherChild.name}>
                            {otherChild.name}
                          </option>
                        ))
                      }
                    </select>
                    <span className="ml-2 text-xs text-gray-500">
                      ({child.keepApart.length}/{unlimitedKeepApart ? '∞' : keepApartLimit})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-green-800">Generated Groups:</h3>
            <div className="flex gap-2">
              <button 
                onClick={copyGroupsToClipboard}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                📋 Copy
              </button>
              <button 
                onClick={exportGroupsAsCSV}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                📊 CSV
              </button>
              <button 
                onClick={exportGroupsAsText}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                📄 Text
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <div key={group.id} className="p-4 bg-white rounded-lg border border-green-300">
                <h4 className="font-semibold text-green-700 mb-2">
                  Group {index + 1} ({group.children.length}/{group.targetSize})
                </h4>
                <ul className="space-y-1">
                  {group.children.map((child, childIndex) => (
                    <li key={child.id} className="text-sm">
                      {childIndex + 1}. {child.name} ({child.gender === 'boy' ? '👦' : '👧'})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button 
            onClick={generateGroups}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Regenerate Groups
          </button>
        </div>
      )}

    </div>
  );
}
