'''
Deque 클래스를 구현하세요.
'''

class Deque:
    '''
    아래의 method들을 작성하세요.
    '''
    def __init__(self) :
        '''
        
        '''
        self.deque = []

    def push_front(self, n) :
        '''
        덱에 정수 n을 맨 앞에 넣습니다.
        '''
        self.deque.insert(0, n)
    
    def push_back(self, n) :
        '''
        덱에 정수 n을 맨 뒤에 넣습니다.
        '''
        self.deque.append(n)

    def pop_front(self) :
        '''
        덱에서 가장 앞에 있는 정수를 제거합니다. 만약 덱에 들어있는 값이 없을 경우에는 아무 일도 하지 않습니다. 
        '''
        if len(self.deque) >= 1:
            del self.deque[0]

    def pop_back(self) :
        '''
        덱에서 가장 뒤에 있는 정수를 제거합니다. 만약 덱에 들어있는 값이 없을 경우에는 아무 일도 하지 않습니다. 
        '''
        if len(self.deque) >= 1:
            del self.deque[-1]

    def size(self) :
        '''
        덱에 들어 있는 정수의 개수를 return 합니다.
        '''
        return len(self.deque)

    def empty(self) :
        '''
        덱이 비어있다면 1, 아니면 0을 return 합니다.
        '''
        if self.size != 0:
            return 0
        else:
            return 1

    def front(self) :
        '''
        덱의 가장 앞에 있는 정수를 return 합니다. 만약 덱에 들어있는 값이 없을 경우에는 -1을 return 합니다.
        '''
        if self.empty == 1:
            return -1
        return self.deque[0]

    def back(self) :
        '''
        덱의 가장 뒤에 있는 정수를 return 합니다. 만약 덱에 들어있는 값이 없을 경우에는 -1을 return 합니다.
        '''
        if self.empty == 1:
            return -1
        return self.deque[-1]
        