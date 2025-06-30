'use client';

import { useState, useRef } from 'react';

type Child = {
  id: number;
  name: string;
  gender: string;
  friends: string[];
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        friends: []
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
      if (child.id === childId && !child.friends.includes(friendName)) {
        return { ...child, friends: [...child.friends, friendName] };
      }
      return child;
    }));
  };

  const updateNumGroups = (newNumGroups: number) => {
    setNumGroups(newNumGroups);
    const newSizes = Array(newNumGroups).fill(4);
    // Keep existing sizes where possible
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

    const shuffledChildren = [...children].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];
    let childIndex = 0;

    // Create groups with specified sizes
    for (let i = 0; i < numGroups; i++) {
      const targetSize = groupSizes[i];
      const groupChildren = shuffledChildren.slice(childIndex, childIndex + targetSize);
      
      if (groupChildren.length > 0) {
        newGroups.push({
          id: Date.now() + i,
          children: groupChildren,
          targetSize: targetSize
        });
        childIndex += targetSize;
      }
    }

    // Handle any remaining children
    if (childIndex < shuffledChildren.length) {
      const remainingChildren = shuffledChildren.slice(childIndex);
      if (newGroups.length > 0) {
        // Distribute remaining children among existing groups
        remainingChildren.forEach((child, index) => {
          const groupIndex = index % newGroups.length;
          newGroups[groupIndex].children.push(child);
        });
      }
    }
    
    setGroups(newGroups);
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
      friends: []
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
                friends: []
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
      <h1 className="text-3xl font-bold text-green-600 mb-6">Group Maker</h1>
      
      {/* Gender Assignment Modal */}
      {showGenderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Assign Genders</h3>
            <p className="text-gray-600 mb-4">
              "These names couldn't be automatically identified. Please assign genders:"
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
          "CSV format: Name,Gender OR just Name (gender will be auto-detected or you'll be asked)"
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
          <h3 className="text-lg font-semibold mb-4">Children ({children.length}):</h3>
          <div className="space-y-4">
            {children.map((child, index) => (
              <div key={child.id} className="p-3 bg-white rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{index + 1}. {child.name} ({child.gender === 'boy' ? '👦 Boy' : '👧 Girl'})</span>
                  <button 
                    onClick={() => removeChild(child.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                {child.friends.length > 0 && (
                  <div className="text-sm text-blue-600 mb-2">
                    Friends: {child.friends.join(', ')}
                  </div>
                )}
                
                <div className="text-sm">
                  <label>Add friend:</label>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        addFriend(child.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="ml-2 p-1 border rounded text-sm"
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-xl font-semibold mb-4 text-green-800">Generated Groups:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group, index) => (
              <div key={group.id} className="p-4 bg-white rounded-lg border border-green-300">
                <h4 className="font-semibold text-green-700 mb-2">
                  Group {index + 1} ({group.children.length}/{group.targetSize})
                </h4>
                <ul className="space-y-1">
                  {group.children.map(child => (
                    <li key={child.id} className="text-sm">
                      {child.name} ({child.gender === 'boy' ? '👦' : '👧'})
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