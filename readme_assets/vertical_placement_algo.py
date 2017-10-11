import random

num_seg = 10
width = 200

def main():
    #########################
    # GENERATE SEGMENT DATA #
    #########################
    segbounds = [random.random() for _ in range(num_seg+2)]
    mi,ma = min(segbounds),max(segbounds)
    norm = lambda x: (x-mi)/(ma-mi)
    segbounds = list(map(norm,segbounds))
    segbounds.sort()
    segsize = [segbounds[i+1]-segbounds[i] for i in range(num_seg)]

    segpos = [random.random() for _ in range(num_seg+2)]
    mi,ma = min(segpos),max(segpos)
    norm = lambda x: (x-mi)/(ma-mi)
    segpos = list(map(norm,segpos))
    segpos = sorted(segpos)[1:-1]
    
    
    ###########################################
    # BUILD SEGMENTS & ASSIGN START POSITIONS #
    ###########################################
    start_pos = (sum(segsize[0:i])+segsize[i]/2.0 for i in range(len(segsize)))
    segments = list(zip(segsize,start_pos,segpos))
    
    printPos(segpos,width) # print best positions
    printSegs(segments,width) # print starting positions


    ######################
    # RUN PLACEMENT ALGO #
    ######################
    for i in range(len(segments)):
        partial = segments[i:]
        push_ideal = partial[0][2]-partial[0][1] # best push for the leading segment
        if  push_ideal < 0:
            continue
        push_bound = 1-(partial[-1][1]+partial[-1][0]/2.0) # maximum push possible without going beyond the boundary
        push_average = sum(seg[2]-seg[1] for seg in partial)/len(partial) #average ideal push of all segments after and including i
        if push_average>0: #dont push if we will do more harm than good
            push = min(push_ideal,push_bound,push_average)
            segments = segments[:i]+[(s[0],s[1]+push,s[2]) for s in partial]
            printSegs(segments,width) # print changed positions
            
    printPos(segpos,width) # print best positions again for reference
    
    
    
    
def printSegs(segments,width):
    i = 0
    p = 0
    pstr = ""
    mid_reached = False
    while p < 1:
        if i< len(segments) and p >= segments[i][1] and not mid_reached:
            pstr+=str(i)
            mid_reached = True
        elif i < len(segments)\
                and p >= (segments[i][1]-segments[i][0]/2.0)\
                and p < (segments[i][1]+segments[i][0]/2.0):
            pstr+='-'
        else:
            pstr+='.'
            if mid_reached:
                i+=1
                mid_reached=False
        p+=1.0/width
    print (pstr)

def printPos(positions,width):
    i = 0
    p = 0
    pstr = ""
    while p < 1:
        if i< len(positions) and p >= positions[i]:
            pstr+=str(i)
            i+=1
        else:
            pstr+='-'
        p+=1.0/width
    print (pstr)
    
main()
