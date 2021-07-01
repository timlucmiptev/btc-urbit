::  hark-graph-hook: notifications for graph-store [landscape]
::
/-  post, group-store, metadata=metadata-store, hook=hark-graph-hook, store=hark-store
/+  resource, mdl=metadata, default-agent, dbug, graph-store, graph, grouplib=group, store=hark-store
::
::
~%  %hark-graph-hook-top  ..part  ~
|%
+$  card  card:agent:gall
+$  versioned-state
  $%  state-0
      state-1
  ==
::
+$  state-0
  [%0 base-state-0]
::
+$  state-1
  [%1 base-state-0]
::
+$  base-state-0
  $:  watching=(set [resource index:post])
      mentions=_&
      watch-on-self=_&
  ==
::
++  scry
  |*  [[our=@p now=@da] =mold p=path]
  ?>  ?=(^ p)
  ?>  ?=(^ t.p)
  .^(mold i.p (scot %p our) i.t.p (scot %da now) t.t.p)
::
++  scry-notif-conversion
  |=  [[our=@p now=@da] desk=term =mark]
  ^-  $-(indexed-post:graph-store (unit notif-kind:hook))
  %^  scry  [our now]
    $-(indexed-post:graph-store (unit notif-kind:hook))
  /cf/[desk]/[mark]/notification-kind
--
::
=|  state-1
=*  state  -
::
=<
%-  agent:dbug
^-  agent:gall
~%  %hark-graph-hook-agent  ..card  ~
|_  =bowl:gall
+*  this  .
    ha    ~(. +> bowl)
    def   ~(. (default-agent this %|) bowl)
    met   ~(. mdl bowl)
    grp   ~(. grouplib bowl)
    gra   ~(. graph bowl)
::
++  on-init
  :_  this
  ~[watch-graph:ha]
::
++  on-save  !>(state)
++  on-load
  |=  =vase
  ^-  (quip card _this)
  =+  !<(old=versioned-state vase)
  =|  cards=(list card)
  |-
  ?:  ?=(%0 -.old)
    %_    $
      -.old  %1
      ::
        cards  
      :_  cards
      [%pass / %agent [our dap]:bowl %poke noun+!>(%rewatch-dms)]
    ==
  :_  this(state old)
  =.  cards  (flop cards)
  %+  welp
    ?:  (~(has by wex.bowl) [/graph our.bowl %graph-store])
      cards
    [watch-graph:ha cards]
  %+  turn
    ^-  (list mark)
    :~  %graph-validator-chat
        %graph-validator-link
        %graph-validator-publish
    ==
  |=  =mark
  ^-  card
  =/  =wire  /validator/[mark]
  =/  =rave:clay  [%sing %f [%da now.bowl] /[mark]/notification-kind]
  [%pass wire %arvo %c %warp our.bowl [%home `rave]]
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  =^  cards  state
    ?+    path  (on-watch:def path)
      ::
        [%updates ~]
      :_  state
      %+  give:ha  ~
      :*  %initial
          watching
          mentions
          watch-on-self
      ==
    ==
  [cards this]
::
++  on-poke
  ~/  %hark-graph-hook-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  |^
  ?>  (team:title our.bowl src.bowl)
  =^  cards  state
    ?+  mark           (on-poke:def mark vase)
        %hark-graph-hook-action
      (hark-graph-hook-action !<(action:hook vase))
        %noun
      (poke-noun !<(* vase))
    ==
  [cards this]
  ::
  ++  poke-noun
    |=  non=*
    [~ state]
::    ?>  ?=(%rewatch-dms non)
::    =/  graphs=(list resource)
::      ~(tap in get-keys:gra)
::    %_   state
::        watching  
::      %-  ~(gas in watching)
::      (murn graphs |=(rid=resource ?:((should-watch:ha rid) `[rid ~] ~)))
::    ==
  ::
  ++  hark-graph-hook-action
    |=  =action:hook
    ^-  (quip card _state)
    |^
    :-  (give:ha ~[/updates] action)
    ?-  -.action
      %listen  (listen +.action)
      %ignore  (ignore +.action)
      %set-mentions  (set-mentions +.action)
      %set-watch-on-self  (set-watch-on-self +.action)
    ==
    ++  listen
      |=  [graph=resource =index:post]
      ^+  state
      state(watching (~(put in watching) [graph index]))
    ::
    ++  ignore
      |=  [graph=resource =index:post]
      ^+  state
      state(watching (~(del in watching) [graph index]))
    ::
    ++  set-mentions
      |=  ment=?
      ^+  state
      state(mentions ment)
    ::
    ++  set-watch-on-self
      |=  self=?
      ^+  state
      state(watch-on-self self)
    --
  --
::
++  on-agent
  ~/  %hark-graph-hook-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  |^
  ?+  -.sign  (on-agent:def wire sign)
      %kick
    :_  this
    ?.  ?=([%graph ~] wire)
      ~
    ~[watch-graph:ha]
  ::
      %fact
    ?.  ?=(%graph-update-2 p.cage.sign)
      (on-agent:def wire sign)
    =^  cards  state
      (graph-update !<(update:graph-store q.cage.sign))
    [cards this]
  ==
  ::
  ++  graph-update
    |=  =update:graph-store
    ^-  (quip card _state)
    ?+    -.q.update  `state
        %add-graph  (add-graph resource.q.update)
      ::
        ?(%remove-graph %archive-graph)  
      (remove-graph resource.q.update)
    ::
        %remove-posts
      (remove-posts resource.q.update indices.q.update)
    ::
        %add-nodes
      =*  rid  resource.q.update
      =/  assoc=(unit association:metadata)
        (peek-association:met %graph rid)
      (check-nodes ~(val by nodes.q.update) rid assoc)
    ==
  ::  this is awful, but notification kind should always switch
  ::  on the index, so hopefully doesn't matter
  ::  TODO: rethink this
  ++  remove-posts
    |=  [rid=resource indices=(set index:graph-store)]
    =/  to-remove
      %-  ~(gas by *(set [resource index:graph-store]))
      (turn ~(tap in indices) (lead rid))
    :_  state(watching (~(dif in watching) to-remove))
    =/  convert  (get-conversion:ha rid)
    %+  roll
      ~(tap in indices)
    |=  [=index:graph-store out=(list card)]
    =|  =indexed-post:graph-store
    =.  index.p.indexed-post  index
    =/  notif-kind=(unit notif-kind:hook)
      (convert indexed-post)
    ?~  notif-kind  out
    =/  =stats-index:store
      [%graph rid (scag parent.index-len.u.notif-kind index)]
    ?.  ?=(%each mode.u.notif-kind)  out
    :_  out 
    (poke-hark %read-each stats-index index)
  ::
  ++  poke-hark
    |=  =action:store
    ^-  card
    [%pass / %agent [our.bowl %hark-store] %poke hark-action+!>(action)]
  ::
  ++  remove-graph
    |=  rid=resource
    =/  unwatched
      %-  ~(gas in *(set [resource index:graph-store]))
      %+  skim  ~(tap in watching)
      |=  [r=resource idx=index:graph-store]
      =(r rid)
    :_  state(watching (~(dif in watching) unwatched))
    ^-  (list card)
    :-  (poke-hark:ha %remove-graph rid)
    %-  zing
    %+  turn  ~(tap in unwatched)
    |=  [r=resource =index:graph-store]
    (give:ha ~[/updates] %ignore r index)
  ::
  ++  add-graph
    |=  rid=resource
    ^-  (quip card _state)
    =/  graph=graph:graph-store  :: graph in subscription is bunted 
      (get-graph-mop:gra rid)
    =/  node=(unit node:graph-store)
      (bind (pry:orm:graph-store graph) |=([@ =node:graph-store] node))
    =/  assoc=(unit association:metadata)
      (peek-association:met %graph rid)
    =^  cards  state
      (check-nodes (drop node) rid assoc)
    ?.  (should-watch:ha rid assoc)
      [cards state]
    :_   state(watching (~(put in watching) [rid ~]))
    (weld cards (give:ha ~[/updates] %listen [rid ~]))
  ::
  ++  check-nodes
    |=  $:  nodes=(list node:graph-store)
            rid=resource
            assoc=(unit association:metadata)
        ==
    abet:check:(abed:handle-update:ha rid nodes)
  --
::
++  on-peek  on-peek:def
::
++  on-leave  on-leave:def
++  on-arvo  
  |=  [=wire =sign-arvo]
  ^-  (quip card _this)
  ?+  wire  (on-arvo:def wire sign-arvo)
    ::
      [%validator @ ~]
    :_  this
    =*  validator  i.t.wire
    =/  =rave:clay  [%next %f [%da now.bowl] /[validator]/notification-kind]
    [%pass wire %arvo %c %warp our.bowl [%home `rave]]~
  ==
++  on-fail   on-fail:def
--
::
|_  =bowl:gall
+*  met   ~(. mdl bowl)
    grp   ~(. grouplib bowl)
    gra   ~(. graph bowl)
::
++  get-conversion
  |=  rid=resource
  ^-  $-(indexed-post:graph-store (unit notif-kind:hook))
  =+  %^  scry  [our now]:bowl
         ,mark=(unit mark)
      /gx/graph-store/graph-mark/(scot %p entity.rid)/[name.rid]/noun
  ?~  mark
    |=(=indexed-post:graph-store ~)
  (scry-notif-conversion [our now]:bowl q.byk.bowl u.mark)
::
++  give
  |=  [paths=(list path) =update:hook]
  ^-  (list card)
  [%give %fact paths hark-graph-hook-update+!>(update)]~
::
++  watch-graph
  ^-  card
  [%pass /graph %agent [our.bowl %graph-store] %watch /updates]
::
++  poke-hark
  |=  =action:store
  ^-  card
  =-  [%pass / %agent [our.bowl %hark-store] %poke -]
  hark-action+!>(action)
::
++  is-mention
  |=  contents=(list content:post)
  ^-  ?
  ?.  mentions  %.n
  ?~  contents  %.n
  ?.  ?=(%mention -.i.contents)
    $(contents t.contents)
  ?:  =(our.bowl ship.i.contents)
    %.y
  $(contents t.contents)
::
++  should-watch
  |=  [rid=resource assoc=(unit association:metadata)]
  ^-  ?
  ?~  assoc
    %.y
  &(watch-on-self =(our.bowl entity.rid))
::
++  handle-update
  |_  $:  rid=resource  ::  input
          updates=(list node:graph-store)
          mark=(unit mark)
          hark-pokes=(list action:store)  :: output
          new-watches=(list index:graph-store)
      ==
  ++  update-core  .
  ::
  ++  abed
    |=  [r=resource upds=(list node:graph-store)]
    =/  m=(unit ^mark)
      (get-mark:gra r)
    update-core(rid r, updates upds, mark m)
  ::
  ++  get-conversion
    ~+  (^get-conversion rid)
  ::
  ++  abet
    ^-  (quip card _state)
    :_  state(watching (~(uni in watching) (silt (turn new-watches (lead rid)))))
    ^-  (list card)
    %+  welp  (turn (flop hark-pokes) poke-hark)
    %-  zing
    %+  turn  (flop new-watches) 
    |=(=index:graph-store (give ~[/updates] [%listen rid index]))
  ::
  ++  hark
    |=  =action:store
    ^+  update-core
    update-core(hark-pokes [action hark-pokes])
  ::
  ++  new-watch
    |=  [=index:graph-store =watch-for:hook =index-len:hook]
    =?  new-watches  =(%siblings watch-for)
      [(scag parent.index-len index) new-watches]
    =?  new-watches  =(%children watch-for)
      [(scag self.index-len index) new-watches]
    update-core
  ::
  ++  check
    |-  ^+  update-core
    ?~  updates  
      update-core
    =/  core=_update-core
      (check-node i.updates)
    =.  updates.core  t.updates
    $(update-core core)
  ::
  ++  check-node-children
    |=  =node:graph-store
    ^+  update-core
    ?:  ?=(%empty -.children.node)
      update-core
    =/  children=(list [=atom =node:graph-store])
      (tap:orm:graph-store p.children.node)
    |-  ^+  update-core
    ?~  children
      update-core
    =.  update-core  (check-node node.i.children)
    $(children t.children)
  ::
  ++  check-node
    |=  =node:graph-store
    ^+  update-core
    =.  update-core  (check-node-children node)
    ?:  ?=(%| -.post.node)
      update-core
    =*  pos  p.post.node
    =/  notif-kind=(unit notif-kind:hook)
      (get-conversion [0 pos])
    ?~  notif-kind
      update-core
    =/  desc=@t
      ?:  (is-mention contents.pos)
        %mention
      name.u.notif-kind
    =*  not-kind  u.notif-kind
    =/  parent=index:post
      (scag parent.index-len.not-kind index.pos)
    =/  notif-index=index:store
      [%graph rid mark desc parent]
    ?:  =(our.bowl author.pos)
      (self-post node notif-index not-kind)
    =.  update-core
      (update-unread-count not-kind notif-index [time-sent index]:pos)
    =?    update-core
        ?|  =(desc %mention)
            (~(has in watching) [rid parent])
            =(mark `%graph-validator-dm)
        ==
      =/  =contents:store
        [%graph (limo pos ~)]
      (add-unread notif-index [time-sent.pos %.n contents])
    update-core
  ::
  ++  update-unread-count
    |=  [=notif-kind:hook =index:store time=@da ref=index:graph-store]
    =/  =stats-index:store
      (to-stats-index:store index)
    ?-  mode.notif-kind 
      %count  (hark %unread-count stats-index time)
      %each   (hark %unread-each stats-index ref time)
      %none   update-core
    ==
  ::
  ++  self-post
    |=  $:  =node:graph-store
            =index:store
            =notif-kind:hook
        ==
    ^+  update-core 
    ?>  ?=(%& -.post.node)
    =/  =stats-index:store
      (to-stats-index:store index)
    =.  update-core
      (hark %seen-index time-sent.p.post.node stats-index)
    =?  update-core  ?=(%count mode.notif-kind)
      (hark %read-count stats-index)
    =?  update-core  watch-on-self
      (new-watch index.p.post.node [watch-for index-len]:notif-kind)
    update-core
  ::
  ++  add-unread
    |=  [=index:store =notification:store]
    (hark %add-note index notification)
  --
--
