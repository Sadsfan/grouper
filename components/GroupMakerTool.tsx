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
  const [draggedChild, setDraggedChild] = useState<Child | null>(null);
  const [draggedFromGroup, setDraggedFromGroup] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportFileInputRef = useRef<HTMLInputElement>(null);

  // Settings for friend/keep-apart limits
  const [friendLimit, setFriendLimit] = useState(3);
  const [keepApartLimit, setKeepApartLimit] = useState(2);
  const [unlimitedFriends, setUnlimitedFriends] = useState(false);
  const [unlimitedKeepApart, setUnlimitedKeepApart] = useState(false);
  const [balanceByGender, setBalanceByGender] = useState(true);

  // Friend priority system
  const [friendPriorities, setFriendPriorities] = useState<{[key: string]: number}>({});
  const [mustBeTogether, setMustBeTogether] = useState<{[key: string]: string[]}>({});

  // Client-side mounting check
  const [mounted, setMounted] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedChildren = localStorage.getItem('groupMakerChildren');
    const savedSettings = localStorage.getItem('groupMakerSettings');
    
    if (savedChildren) {
      try {
        const loadedChildren = JSON.parse(savedChildren) as Child[];
        const updatedChildren = loadedChildren.map((child: Child) => ({
          ...child,
          keepApart: child.keepApart || []
        }));
        setChildren(updatedChildren);
      } catch {
        console.error('Error loading saved children');
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as {
          friendPriorities?: {[key: string]: number};
          mustBeTogether?: {[key: string]: string[]};
          friendLimit?: number;
          keepApartLimit?: number;
          unlimitedFriends?: boolean;
          unlimitedKeepApart?: boolean;
          balanceByGender?: boolean;
        };
        setFriendPriorities(settings.friendPriorities || {});
        setMustBeTogether(settings.mustBeTogether || {});
        setFriendLimit(settings.friendLimit || 3);
        setKeepApartLimit(settings.keepApartLimit || 2);
        setUnlimitedFriends(settings.unlimitedFriends || false);
        setUnlimitedKeepApart(settings.unlimitedKeepApart || false);
        setBalanceByGender(settings.balanceByGender !== false);
      } catch {
        console.error('Error loading saved settings');
      }
    }
  }, []);

  // Save children whenever the list changes
  useEffect(() => {
    if (children.length > 0) {
      localStorage.setItem('groupMakerChildren', JSON.stringify(children));
    }
  }, [children]);

  // Save settings whenever they change
  useEffect(() => {
    const settings = {
      friendPriorities,
      mustBeTogether,
      friendLimit,
      keepApartLimit,
      unlimitedFriends,
      unlimitedKeepApart,
      balanceByGender
    };
    localStorage.setItem('groupMakerSettings', JSON.stringify(settings));
  }, [friendPriorities, mustBeTogether, friendLimit, keepApartLimit, unlimitedFriends, unlimitedKeepApart, balanceByGender]);

  // Client mounting check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration errors
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
        balanceByGender
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
        const jsonData = JSON.parse(e.target?.result as string) as Child[] | {
          children: Child[];
          settings?: {
            friendPriorities?: {[key: string]: number};
            mustBeTogether?: {[key: string]: string[]};
            friendLimit?: number;
            keepApartLimit?: number;
            unlimitedFriends?: boolean;
            unlimitedKeepApart?: boolean;
            balanceByGender?: boolean;
          };
        };
        
        // Handle both old format (just children array) and new format (children + settings)
        if (Array.isArray(jsonData)) {
          // Old format
          if (jsonData.every(child => child.name && child.gender)) {
            const updatedData = jsonData.map(child => ({
              ...child,
              keepApart: child.keepApart || []
            }));
            setChildren(updatedData);
            alert('Children data loaded successfully!');
          } else {
            alert('Invalid file format. Please upload a valid Group Maker JSON file.');
          }
        } else if (jsonData.children && Array.isArray(jsonData.children)) {
          // New format with settings
          const updatedData = jsonData.children.map((child: Child) => ({
            ...child,
            keepApart: child.keepApart || []
          }));
          setChildren(updatedData);
          
          if (jsonData.settings) {
            const settings = jsonData.settings;
            setFriendPriorities(settings.friendPriorities || {});
            setMustBeTogether(settings.mustBeTogether || {});
            setFriendLimit(settings.friendLimit || 3);
            setKeepApartLimit(settings.keepApartLimit || 2);
            setUnlimitedFriends(settings.unlimitedFriends || false);
            setUnlimitedKeepApart(settings.unlimitedKeepApart || false);
            setBalanceByGender(settings.balanceByGender !== false);
          }
          
          alert('Children data and settings loaded successfully!');
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
      const boys = group.children.filter(c => c.gender === 'boy').length;
      const girls = group.children.filter(c => c.gender === 'girl').length;
      
      textContent += `GROUP ${index + 1} (${group.children.length}/${group.targetSize}) - ${boys}B/${girls}G:\n`;
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
      const boys = group.children.filter(c => c.gender === 'boy').length;
      const girls = group.children.filter(c => c.gender === 'girl').length;
      
      textContent += `GROUP ${index + 1} (${boys}B/${girls}G):\n`;
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
    const maleNames = ['noah', 'kieran', 'edward', 'owen', 'drew', 'beau', 'eoin', 'euan', 'lorenzo', 'rory', 'cian', 'patryk', 'james', 'john', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 'alexander', 'patrick', 'frank', 'raymond', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan', 'peter', 'zachary', 'kyle', 'arthur', 'larry', 'noah', 'ethan', 'lucas', 'mason', 'aiden', 'jackson', 'logan', 'david', 'oliver', 'sebastian', 'elijah', 'julian', 'mateo', 'luke', 'anthony', 'diego', 'jacob', 'liam', 'connor'];
    const femaleNames = ['charlotte', 'ellie', 'connie', 'elisa', 'sadie', 'christy', 'aoife', 'beatrix', 'dolly', 'lilly', 'orlaith', 'caoimhe', 'evelyn', 'darcie', 'esme', 'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'amy', 'angela', 'ashley', 'brenda', 'emma', 'olivia', 'sophia', 'ava', 'isabella', 'mia', 'abigail', 'emily', 'charlotte', 'harper', 'madison', 'amelia', 'elizabeth', 'sofia', 'evelyn', 'avery', 'chloe', 'ella', 'grace', 'victoria', 'aubrey', 'scarlett', 'zoey', 'hannah', 'addison', 'leah', 'naomi', 'natalie', 'elena', 'lydia', 'claire', 'savannah', 'stella', 'aria', 'riley', 'zoe'];
    
    const firstName = name.toLowerCase().split(' ')[0];
    
    if (maleNames.includes(firstName)) return 'boy';
    if (femaleNames.includes(firstName)) return 'girl';
    return null;
  };

  const validateChildName = (name: string): string | null => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return 'Name cannot be empty';
    }
    if (trimmedName.length > 50) {
      return 'Name is too long (max 50 characters)';
    }
    if (children.some(child => child.name.toLowerCase() === trimmedName.toLowerCase())) {
      return 'A child with this name already exists';
    }
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
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
        // Remove from other children's friend/keepApart lists
        setChildren(prev => prev
          .filter(child => child.id !== id)
          .map(child => ({
            ...child,
            friends: child.friends.filter(f => f !== childToRemove.name),
            keepApart: child.keepApart.filter(k => k !== childToRemove.name)
          }))
        );
        
        // Clean up priorities and mustBeTogether
        setFriendPriorities(prev => {
          const newPriorities = { ...prev };
          Object.keys(newPriorities).forEach(key => {
            if (key.startsWith(`${id}-`) || key.includes(`-${childToRemove.name}`)) {
              delete newPriorities[key];
            }
          });
          return newPriorities;
        });
        
        setMustBeTogether(prev => {
          const newMustBe = { ...prev };
          delete newMustBe[id.toString()];
          Object.keys(newMustBe).forEach(key => {
            newMustBe[key] = newMustBe[key].filter(name => name !== childToRemove.name);
          });
          return newMustBe;
        });
      }
    }
  };

  const addFriend = (childId: number, friendName: string) => {
    if (!friendName.trim()) return;
    
    const trimmedName = friendName.trim();
    const friendChild = children.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    
    if (!friendChild) {
      alert('Friend not found in the children list.');
      return;
    }
    
    if (friendChild.id === childId) {
      alert('A child cannot be friends with themselves.');
      return;
    }
    
    setChildren(children.map(child => {
      if (child.id === childId) {
        const maxFriends = unlimitedFriends ? 999 : friendLimit;
        if (child.friends.length < maxFriends && !child.friends.includes(trimmedName)) {
          return { ...child, friends: [...child.friends, trimmedName] };
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
    
    // Remove priority and mustBeTogether settings
    const key = `${childId}-${friendName}`;
    setFriendPriorities(prev => {
      const newPriorities = { ...prev };
      delete newPriorities[key];
      return newPriorities;
    });
    
    setMustBeTogether(prev => {
      const childKey = childId.toString();
      const currentMustBe = prev[childKey] || [];
      return {
        ...prev,
        [childKey]: currentMustBe.filter(name => name !== friendName)
      };
    });
  };

  const addKeepApart = (childId: number, personName: string) => {
    if (!personName.trim()) return;
    
    const trimmedName = personName.trim();
    const otherChild = children.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    
    if (!otherChild) {
      alert('Person not found in the children list.');
      return;
    }
    
    if (otherChild.id === childId) {
      alert('A child cannot be kept apart from themselves.');
      return;
    }
    
    setChildren(children.map(child => {
      if (child.id === childId) {
        const maxKeepApart = unlimitedKeepApart ? 999 : keepApartLimit;
        if (child.keepApart.length < maxKeepApart && !child.keepApart.includes(trimmedName)) {
          return { ...child, keepApart: [...child.keepApart, trimmedName] };
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

  // Friend priority functions
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
    return friendPriorities[key] || 1; // Default priority 1 (normal)
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

  // Enhanced group generation algorithm
  const generateGroups = () => {
    if (children.length === 0) {
      alert('Please add some children first.');
      return;
    }

    const totalTargetSize = getTotalTargetSize();
    if (children.length > totalTargetSize) {
      if (!confirm(`You have ${children.length} children but only ${totalTargetSize} spots in groups. Some children won't be assigned. Continue?`)) {
        return;
      }
    }

    // Enhanced smart algorithm with priority support and gender balancing
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

    // Helper functions
    const shouldKeepApart = (child1: Child, child2: Child) => {
      return child1.keepApart.includes(child2.name) || child2.keepApart.includes(child1.name);
    };

    const areFriends = (child1: Child, child2: Child) => {
      return child1.friends.includes(child2.name) || child2.friends.includes(child1.name);
    };

    const getFriendshipPriority = (child1: Child, child2: Child) => {
      const priority1 = getFriendPriority(child1.id, child2.name);
      const priority2 = getFriendPriority(child2.id, child1.name);
      return Math.max(priority1, priority2);
    };

    const mustBeTogetherWith = (child1: Child, child2: Child) => {
      return isMustBeTogether(child1.id, child2.name) || isMustBeTogether(child2.id, child1.name);
    };

    const getGenderBalance = (group: Child[]) => {
      const boys = group.filter(c => c.gender === 'boy').length;
      const girls = group.filter(c => c.gender === 'girl').length;
      return Math.abs(boys - girls);
    };

    const canAddToGroup = (child: Child, group: Child[], targetSize: number) => {
      if (group.length >= targetSize) return false;
      
      for (const groupChild of group) {
        if (shouldKeepApart(child, groupChild)) {
          return false;
        }
      }
      return true;
    };

    // Phase 0: Handle "Must be together" groups first
    const processedChildren = new Set<number>();
    
    for (const child of remainingChildren) {
      if (processedChildren.has(child.id)) continue;
      
      // Find all children that MUST be with this child (recursive search)
      const mustBeTogetherGroup = [child];
      const toCheck = [child];
      
      while (toCheck.length > 0) {
        const currentChild = toCheck.pop()!;
        
        for (const otherChild of remainingChildren) {
          if (otherChild.id !== currentChild.id && 
              !processedChildren.has(otherChild.id) && 
              !mustBeTogetherGroup.includes(otherChild)) {
            if (mustBeTogetherWith(currentChild, otherChild)) {
              mustBeTogetherGroup.push(otherChild);
              toCheck.push(otherChild);
            }
          }
        }
      }
      
      // If we have a "must be together" group, place them together
      if (mustBeTogetherGroup.length > 1) {
        // Find a group that can fit them all
        let bestGroup = -1;
        let bestScore = -1000;
        
        for (let groupIndex = 0; groupIndex < newGroups.length; groupIndex++) {
          const group = newGroups[groupIndex];
          if (group.children.length + mustBeTogetherGroup.length <= group.targetSize) {
            let canPlaceAll = true;
            for (const mustBeChild of mustBeTogetherGroup) {
              if (!canAddToGroup(mustBeChild, group.children, group.targetSize)) {
                canPlaceAll = false;
                break;
              }
            }
            
            if (canPlaceAll) {
              let score = 100; // Base score for fitting the must-be-together group
              
              // Bonus for gender balance if enabled
              if (balanceByGender) {
                const newGroupComposition = [...group.children, ...mustBeTogetherGroup];
                const balanceScore = -getGenderBalance(newGroupComposition) * 5;
                score += balanceScore;
              }
              
              // Prefer less full groups
              const spaceScore = (group.targetSize - group.children.length) * 2;
              score += spaceScore;
              
              if (score > bestScore) {
                bestScore = score;
                bestGroup = groupIndex;
              }
            }
          }
        }
        
        if (bestGroup !== -1) {
          newGroups[bestGroup].children.push(...mustBeTogetherGroup);
          mustBeTogetherGroup.forEach(c => processedChildren.add(c.id));
        } else {
          // Force into the least full group that can accommodate them
          const sortedGroups = newGroups
            .map((group, index) => ({ group, index, space: group.targetSize - group.children.length }))
            .sort((a, b) => b.space - a.space);
          
          for (const { group, index } of sortedGroups) {
            if (group.children.length + mustBeTogetherGroup.length <= group.targetSize + 2) { // Allow slight overflow
              newGroups[index].children.push(...mustBeTogetherGroup);
              mustBeTogetherGroup.forEach(c => processedChildren.add(c.id));
              break;
            }
          }
        }
      }
    }

    // Remove processed children from remaining
    const stillRemaining = remainingChildren.filter(child => !processedChildren.has(child.id));

    // Phase 1: Place children with high-priority friends
    const childrenWithFriends = stillRemaining.filter(child => child.friends.length > 0);
    childrenWithFriends.sort((a, b) => {
      // Sort by highest priority friendships first
      const aMaxPriority = Math.max(...a.friends.map(fname => getFriendPriority(a.id, fname)));
      const bMaxPriority = Math.max(...b.friends.map(fname => getFriendPriority(b.id, fname)));
      if (aMaxPriority !== bMaxPriority) return bMaxPriority - aMaxPriority;
      
      // Then by number of friends
      return b.friends.length - a.friends.length;
    });

    for (const child of childrenWithFriends) {
      if (!stillRemaining.includes(child)) continue;

      let bestGroup = -1;
      let bestScore = -1000;

      for (let groupIndex = 0; groupIndex < newGroups.length; groupIndex++) {
        const group = newGroups[groupIndex];
        if (!canAddToGroup(child, group.children, group.targetSize)) continue;

        let score = 0;
        
        // Calculate friendship scores
        for (const groupChild of group.children) {
          if (areFriends(child, groupChild)) {
            const priority = getFriendshipPriority(child, groupChild);
            score += priority * 150; // High weight for friendship priority
          }
        }

        // Gender balance bonus
        if (balanceByGender) {
          const newGroupComposition = [...group.children, child];
          const currentBalance = getGenderBalance(group.children);
          const newBalance = getGenderBalance(newGroupComposition);
          if (newBalance < currentBalance) {
            score += 50; // Bonus for improving gender balance
          } else if (newBalance > currentBalance) {
            score -= 25; // Penalty for worsening gender balance
          }
        }

        // Prefer groups with more space
        const spacePenalty = (group.children.length / group.targetSize) * 30;
        score -= spacePenalty;

        if (score > bestScore) {
          bestScore = score;
          bestGroup = groupIndex;
        }
      }

      if (bestGroup !== -1) {
        newGroups[bestGroup].children.push(child);
        stillRemaining.splice(stillRemaining.indexOf(child), 1);
      }
    }

    // Phase 2: Place remaining children with smart distribution
    while (stillRemaining.length > 0) {
      const child = stillRemaining[0];
      
      let bestGroup = -1;
      let bestScore = -1000;

      for (let groupIndex = 0; groupIndex < newGroups.length; groupIndex++) {
        const group = newGroups[groupIndex];
        if (!canAddToGroup(child, group.children, group.targetSize)) continue;

        let score = 0;
        
        // Friendship bonus
        for (const groupChild of group.children) {
          if (areFriends(child, groupChild)) {
            const priority = getFriendshipPriority(child, groupChild);
            score += priority * 100;
          }
        }

        // Gender balance consideration
        if (balanceByGender) {
          const newGroupComposition = [...group.children, child];
          const currentBalance = getGenderBalance(group.children);
          const newBalance = getGenderBalance(newGroupComposition);
          if (newBalance < currentBalance) {
            score += 40;
          } else if (newBalance > currentBalance) {
            score -= 20;
          }
        }

        // Strongly prefer less full groups
        const spacePenalty = (group.children.length / group.targetSize) * 50;
        score -= spacePenalty;

        if (score > bestScore) {
          bestScore = score;
          bestGroup = groupIndex;
        }
      }
      
      if (bestGroup !== -1) {
        newGroups[bestGroup].children.push(child);
      } else {
        // Force placement in least full group (emergency fallback)
        const leastFullGroup = newGroups.reduce((min, group, index) => 
          group.children.length < newGroups[min].children.length ? index : min, 0);
        newGroups[leastFullGroup].children.push(child);
      }
      
      stillRemaining.shift();
    }

    setGroups(newGroups);
    
    // Calculate and display satisfaction metrics
    calculateAndDisplayMetrics(newGroups);
  };

  const calculateAndDisplayMetrics = (generatedGroups: Group[]) => {
    let totalFriendConnections = 0;
    let totalPriorityScore = 0;
    let mustBeTogetherViolations = 0;
    let keepApartViolations = 0;
    let genderBalanceScore = 0;
    
    generatedGroups.forEach(group => {
      // Calculate gender balance for this group
      const boys = group.children.filter(c => c.gender === 'boy').length;
      const girls = group.children.filter(c => c.gender === 'girl').length;
      genderBalanceScore += Math.abs(boys - girls);
      
      // Check all pairs in the group
      for (let i = 0; i < group.children.length; i++) {
        for (let j = i + 1; j < group.children.length; j++) {
          const child1 = group.children[i];
          const child2 = group.children[j];
          
          // Count friendships and their priorities
          if (areFriends(child1, child2)) {
            totalFriendConnections++;
            const priority = getFriendshipPriority(child1, child2);
            totalPriorityScore += priority;
          }
          
          // Count keep-apart violations
          if (shouldKeepApart(child1, child2)) {
            keepApartViolations++;
          }
        }
      }
    });

    // Check for must-be-together violations
    children.forEach(child => {
      const childKey = child.id.toString();
      const mustBeWith = mustBeTogether[childKey] || [];
      
      mustBeWith.forEach(friendName => {
        const friend = children.find(c => c.name === friendName);
        if (friend) {
          const childGroup = generatedGroups.find(g => g.children.some(c => c.id === child.id));
          const friendGroup = generatedGroups.find(g => g.children.some(c => c.id === friend.id));
          
          if (childGroup !== friendGroup) {
            mustBeTogetherViolations++;
          }
        }
      });
    });

    const totalChildren = children.length;
    const assignedChildren = generatedGroups.reduce((sum, group) => sum + group.children.length, 0);
    
    setTimeout(() => {
      let message = `Groups generated successfully!\n\n`;
      message += `📊 ASSIGNMENT SUMMARY:\n`;
      message += `• Children assigned: ${assignedChildren}/${totalChildren}\n`;
      if (assignedChildren < totalChildren) {
        message += `• Unassigned: ${totalChildren - assignedChildren}\n`;
      }
      message += `\n🤝 RELATIONSHIP METRICS:\n`;
      message += `• Friend connections: ${totalFriendConnections}\n`;
      message += `• Priority score: ${totalPriorityScore}\n`;
      message += `• Must-be-together violations: ${mustBeTogetherViolations}\n`;
      message += `• Keep-apart violations: ${keepApartViolations}\n`;
      if (balanceByGender) {
        message += `• Gender balance score: ${genderBalanceScore} (lower is better)\n`;
      }
      
      message += `\n📋 GROUP BREAKDOWN:\n`;
      generatedGroups.forEach((group, index) => {
        const boys = group.children.filter(c => c.gender === 'boy').length;
        const girls = group.children.filter(c => c.gender === 'girl').length;
        message += `• Group ${index + 1}: ${group.children.length}/${group.targetSize} (${boys}B/${girls}G)\n`;
      });
      
      alert(message);
    }, 100);
  };

  // Helper functions continued
  const areFriends = (child1: Child, child2: Child) => {
    return child1.friends.includes(child2.name) || child2.friends.includes(child1.name);
  };

  const shouldKeepApart = (child1: Child, child2: Child) => {
    return child1.keepApart.includes(child2.name) || child2.keepApart.includes(child1.name);
  };

  const getFriendshipPriority = (child1: Child, child2: Child) => {
    const priority1 = getFriendPriority(child1.id, child2.name);
    const priority2 = getFriendPriority(child2.id, child1.name);
    return Math.max(priority1, priority2);
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
        if (line.trim() && index > 0) { // Skip header row
          const parts = line.split(',').map(part => part.trim().replace(/['"]/g, ''));
          const name = parts[0];
          
          if (name && validateChildName(name) === null) {
            let childGender = null;
            
            // Check if gender is provided in CSV
            if (parts[1] && (parts[1].toLowerCase() === 'girl' || parts[1].toLowerCase() === 'boy')) {
              childGender = parts[1].toLowerCase();
            } else {
              // Try auto-detection
              childGender = detectGender(name);
            }

            if (childGender) {
              newChildren.push({
                id: Date.now() + index + Math.random(),
                name: name,
                gender: childGender,
                friends: [],
                keepApart: []
              });
            } else {
              needsGenderAssignment.push({
                id: Date.now() + index + Math.random(),
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

      if (newChildren.length === 0 && needsGenderAssignment.length === 0) {
        alert('No valid children found in CSV. Please check the format.');
      } else {
        alert(`Added ${newChildren.length} children automatically. ${needsGenderAssignment.length} need gender assignment.`);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  // Drag and drop functionality
  const handleDragStart = (child: Child, fromGroupIndex: number | null) => {
    setDraggedChild(child);
    setDraggedFromGroup(fromGroupIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toGroupIndex: number) => {
    e.preventDefault();
    
    if (!draggedChild) return;

    const newGroups = [...groups];
    
    // Remove from source group
    if (draggedFromGroup !== null) {
      newGroups[draggedFromGroup].children = newGroups[draggedFromGroup].children.filter(
        c => c.id !== draggedChild.id
      );
    }
    
    // Add to target group (if there's space)
    if (newGroups[toGroupIndex].children.length < newGroups[toGroupIndex].targetSize) {
      newGroups[toGroupIndex].children.push(draggedChild);
    } else {
      alert('Target group is full!');
      return;
    }
    
    setGroups(newGroups);
    setDraggedChild(null);
    setDraggedFromGroup(null);
  };

  const moveChildBetweenGroups = (child: Child, fromGroupIndex: number, toGroupIndex: number) => {
    if (fromGroupIndex === toGroupIndex) return;
    
    const newGroups = [...groups];
    
    // Check if target group has space
    if (newGroups[toGroupIndex].children.length >= newGroups[toGroupIndex].targetSize) {
      alert('Target group is full!');
      return;
    }
    
    // Remove from source group
    newGroups[fromGroupIndex].children = newGroups[fromGroupIndex].children.filter(
      c => c.id !== child.id
    );
    
    // Add to target group
    newGroups[toGroupIndex].children.push(child);
    
    setGroups(newGroups);
  };

  // Auto-balance groups by gender
  const autoBalanceGroups = () => {
    if (groups.length === 0) {
      alert('Please generate groups first.');
      return;
    }

    const newGroups = [...groups];
    let moved = true;
    let iterations = 0;
    const maxIterations = 20;

    while (moved && iterations < maxIterations) {
      moved = false;
      iterations++;

      for (let i = 0; i < newGroups.length; i++) {
        for (let j = i + 1; j < newGroups.length; j++) {
          const group1 = newGroups[i];
          const group2 = newGroups[j];

          const g1Boys = group1.children.filter(c => c.gender === 'boy').length;
          const g1Girls = group1.children.filter(c => c.gender === 'girl').length;
          const g2Boys = group2.children.filter(c => c.gender === 'boy').length;
          const g2Girls = group2.children.filter(c => c.gender === 'girl').length;

          const currentImbalance = Math.abs(g1Boys - g1Girls) + Math.abs(g2Boys - g2Girls);

          // Try swapping children of different genders
          for (const child1 of group1.children) {
            for (const child2 of group2.children) {
              if (child1.gender !== child2.gender) {
                // Check if swap would improve balance and not violate constraints
                const canSwap = !shouldKeepApart(child1, child2) &&
                  group1.children.every(c => c.id === child1.id || !shouldKeepApart(child2, c)) &&
                  group2.children.every(c => c.id === child2.id || !shouldKeepApart(child1, c));

                if (canSwap) {
                  // Calculate new balance after swap
                  const newG1Boys = child1.gender === 'boy' ? g1Boys - 1 : child2.gender === 'boy' ? g1Boys + 1 : g1Boys;
                  const newG1Girls = child1.gender === 'girl' ? g1Girls - 1 : child2.gender === 'girl' ? g1Girls + 1 : g1Girls;
                  const newG2Boys = child2.gender === 'boy' ? g2Boys - 1 : child1.gender === 'boy' ? g2Boys + 1 : g2Boys;
                  const newG2Girls = child2.gender === 'girl' ? g2Girls - 1 : child1.gender === 'girl' ? g2Girls + 1 : g2Girls;

                  const newImbalance = Math.abs(newG1Boys - newG1Girls) + Math.abs(newG2Boys - newG2Girls);

                  if (newImbalance < currentImbalance) {
                    // Perform the swap
                    group1.children = group1.children.filter(c => c.id !== child1.id);
                    group2.children = group2.children.filter(c => c.id !== child2.id);
                    group1.children.push(child2);
                    group2.children.push(child1);
                    moved = true;
                    break;
                  }
                }
              }
            }
            if (moved) break;
          }
          if (moved) break;
        }
        if (moved) break;
      }
    }

    setGroups(newGroups);
    alert(`Auto-balance completed after ${iterations} iterations.`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-green-600">Group Maker</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={downloadChildrenData}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            disabled={children.length === 0}
            title="Save all data and settings"
          >
            💾 Save Data
          </button>
          <button
            onClick={() => exportFileInputRef.current?.click()}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            title="Load data and settings"
          >
            📁 Load Data
          </button>
          <button
            onClick={clearAllData}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            disabled={children.length === 0}
            title="Clear all children and settings"
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
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Assign Genders</h3>
            <p className="text-gray-600 mb-4">
              These names couldn&apos;t be automatically identified. Please assign genders:
            </p>
            <div className="space-y-3 mb-6">
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
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenderAssignments}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add All Children
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <h2 className="text-xl font-semibold mb-4">⚙️ Relationship Settings</h2>
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
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>1</span>
                    <span>10</span>
                  </div>
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
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">⚖️ Group Balance</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={balanceByGender}
                onChange={(e) => setBalanceByGender(e.target.checked)}
                className="mr-2"
              />
              Balance groups by gender
            </label>
            <p className="text-sm text-gray-600 mt-2">
              Attempts to distribute boys and girls evenly across groups
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-sm mb-2">🌟 Friend Priority Legend:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-100 border rounded"></span>
              ⭐ Normal Priority
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-200 border rounded"></span>
              ⭐⭐ Important Priority
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-300 border rounded"></span>
              ⭐⭐⭐ Critical Priority
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-100 border-2 border-red-400 rounded"></span>
              🔒 Must be together
            </span>
          </div>
        </div>
      </div>
      
      {/* CSV Upload Section */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h2 className="text-xl font-semibold mb-4">📂 Upload CSV</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📤 Upload CSV File
          </button>
          <div className="text-sm text-gray-600">
            <p><strong>CSV format:</strong> Name,Gender OR just Name</p>
            <p>Gender will be auto-detected when possible</p>
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
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addChild()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={addChild}
              disabled={!name.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
              <div className="text-xs text-gray-600 flex justify-between">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">
                <strong>Total children:</strong> {children.length}<br/>
                <strong>Total group capacity:</strong> {getTotalTargetSize()}<br/>
                <strong>Utilization:</strong> {Math.round((children.length / getTotalTargetSize()) * 100)}%
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
                    className="w-full p-2 border rounded text-center focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              onClick={generateGroups}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors"
              disabled={children.length === 0}
            >
              🎲 Generate Groups
            </button>
            
            {groups.length > 0 && (
              <>
                <button
                  onClick={autoBalanceGroups}
                  className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  disabled={!balanceByGender}
                  title={!balanceByGender ? "Enable gender balancing first" : "Auto-balance groups by gender"}
                >
                  ⚖️ Auto-Balance
                </button>
              </>
            )}
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
                  <button
                    onClick={() => removeChild(child.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Remove child"
                  >
                    ❌
                  </button>
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
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-700">🎯 Generated Groups</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={copyGroupsToClipboard}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                📋 Copy
              </button>
              <button
                onClick={exportGroupsAsText}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                📄 Export Text
              </button>
              <button
                onClick={exportGroupsAsCSV}
                className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
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
                <div
                  key={group.id}
                  className="bg-white p-4 rounded-lg border shadow-sm"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, groupIndex)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">
                      Group {groupIndex + 1}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {group.children.length}/{group.targetSize} ({boys}B/{girls}G)
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {group.children.map((child, childIndex) => (
                      <div
                        key={child.id}
                        draggable
                        onDragStart={() => handleDragStart(child, groupIndex)}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {childIndex + 1}. {child.name}
                          </span>
                          <span className="text-xs">
                            {child.gender === 'boy' ? '👦' : '👧'}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          {groups.map((_, targetGroupIndex) => {
                            if (targetGroupIndex === groupIndex) return null;
                            return (
                              <button
                                key={targetGroupIndex}
                                onClick={() => moveChildBetweenGroups(child, groupIndex, targetGroupIndex)}
                                className="text-xs px-1 py-0.5 bg-blue-100 hover:bg-blue-200 rounded"
                                title={`Move to Group ${targetGroupIndex + 1}`}
                                disabled={groups[targetGroupIndex].children.length >= groups[targetGroupIndex].targetSize}
                              >
                                →{targetGroupIndex + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    
                    {group.children.length === 0 && (
                      <p className="text-gray-500 text-sm italic text-center py-4">
                        Empty group - drag children here
                      </p>
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
                <strong>Generate groups</strong> using the smart algorithm, then fine-tune by dragging children between groups or using auto-balance.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">5.</span>
              <div>
                <strong>Export results</strong> as text, CSV, or copy to clipboard for easy sharing.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
