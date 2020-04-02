/* worker/main.c
**
**  the main loop of a serf process.
*/
#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <setjmp.h>
#include <gmp.h>
#include <sigsegv.h>
#include <stdint.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <uv.h>
#include <errno.h>
#include <ncurses/curses.h>
#include <termios.h>
#include <ncurses/term.h>

#include "all.h"
#include <vere/vere.h>

    typedef struct _u3_serf {
      c3_d    sen_d;                        //  last event requested
      c3_d    dun_d;                        //  last event processed
      c3_l    mug_l;                        //  hash of state
      u3_noun   sac;                        //  space measurement
      c3_o    pac_o;                        //  pack kernel
      c3_o    rec_o;                        //  reclaim cash
      c3_d    key_d[4];                     //  disk key
      u3_moat inn_u;                        //  message input
      u3_mojo out_u;                        //  message output
      c3_c*   dir_c;                        //  execution directory (pier)
    } u3_serf;
    static u3_serf u3V;

/*
|%
::  +writ: from king to serf
::
+$  writ
  $%  $:  %live
          $%  [%exit cod=@]
              [%save eve=@]
              [%walk eve=@]
      ==  ==
      [%peek now=date lyc=gang pat=path]
      [%play eve=@ lit=(list $?((pair date ovum) *))]
      [%work eve=@ job=(pair date ovum)]
  ==
::  +plea: from serf to king
::
+$  plea
  $%  [%ripe pro=@ kel=(list (pair term @ud)) eve=@ mug=@]
      [%slog pri=@ =tank]
      [%peek pat=path dat=(unit (cask))]
      $:  %play
          eve=@
          $%  [%done mug=@]
              [%bail dud=goof]
      ==  ==
      $:  %work
          eve=@
          $%  [%done mug=@ fec=(list ovum)]
              [%swap mug=@ job=(pair date ovum) fec=(list ovum)]
              [%bail dud=(list goof)]
      ==  ==
  ==
--

questions:

- %peek
  - persistent dates? (in arvo or serf)
  - response on block/unit?
- %play
  - expect lifecycle on [%ripe ... eve=0 mug=0]
  - eve identifies failed event on [%play @ %bail ...]
- %live unacknowledged, crash on failure
  - %walk resyncs eve
  - %save both %fast and %full? (save to where? ack? continue after?)
- %pack
  - could just be [%save %full ...] followed by a restart
- %mass
  - is technically a query of the serf directly
- milliseconds
  - in $writ for timeouts
  - in $plea for measurement
- duct or vane stack for spinner
- slog back to toplevel?
*/

/* _serf_space(): print n spaces.
*/
static void
_serf_space(FILE* fil_u,  c3_w n)
{
  for (; n > 0; n--)
    (fprintf(fil_u," "));
}

/* _serf_print_memory(): print memory amount.
**
**  Helper for _serf_prof(), just an un-captioned u3a_print_memory().
*/
static void
_serf_print_memory(FILE* fil_u, c3_w wor_w)
{
  c3_w byt_w = (wor_w * 4);
  c3_w gib_w = (byt_w / 1000000000);
  c3_w mib_w = (byt_w % 1000000000) / 1000000;
  c3_w kib_w = (byt_w % 1000000) / 1000;
  c3_w bib_w = (byt_w % 1000);

  if ( gib_w ) {
    (fprintf(fil_u, "GB/%d.%03d.%03d.%03d\r\n",
        gib_w, mib_w, kib_w, bib_w));
  }
  else if ( mib_w ) {
    (fprintf(fil_u, "MB/%d.%03d.%03d\r\n", mib_w, kib_w, bib_w));
  }
  else if ( kib_w ) {
    (fprintf(fil_u, "KB/%d.%03d\r\n", kib_w, bib_w));
  }
  else {
    (fprintf(fil_u, "B/%d\r\n", bib_w));
  }
}

/* _serf_prof(): print memory profile. RETAIN.
*/
c3_w
_serf_prof(FILE* fil_u, c3_w den, u3_noun mas)
{
  c3_w tot_w = 0;
  u3_noun h_mas, t_mas;

  if ( c3n == u3r_cell(mas, &h_mas, &t_mas) ) {
    _serf_space(fil_u, den);
    fprintf(fil_u, "mistyped mass\r\n");
    return tot_w;
  }
  else if ( _(u3du(h_mas)) ) {
    _serf_space(fil_u, den);
    fprintf(fil_u, "mistyped mass head\r\n");
    {
      c3_c* lab_c = u3m_pretty(h_mas);
      fprintf(fil_u, "h_mas: %s", lab_c);
      c3_free(lab_c);
    }
    return tot_w;
  }
  else {
    _serf_space(fil_u, den);

    {
      c3_c* lab_c = u3m_pretty(h_mas);
      fprintf(fil_u, "%s: ", lab_c);
      c3_free(lab_c);
    }

    u3_noun it_mas, tt_mas;

    if ( c3n == u3r_cell(t_mas, &it_mas, &tt_mas) ) {
      fprintf(fil_u, "mistyped mass tail\r\n");
      return tot_w;
    }
    else if ( c3y == it_mas ) {
      tot_w += u3a_mark_noun(tt_mas);
      _serf_print_memory(fil_u, tot_w);

#if 1
      /* The basic issue here is that tt_mas is included in .sac
       * (the whole profile), so they can't both be roots in the
       * normal sense. When we mark .sac later on, we want tt_mas
       * to appear unmarked, but its children should be already
       * marked.
      */
      if ( _(u3a_is_dog(tt_mas)) ) {
        u3a_box* box_u = u3a_botox(u3a_to_ptr(tt_mas));
#ifdef U3_MEMORY_DEBUG
        if ( 1 == box_u->eus_w ) {
          box_u->eus_w = 0xffffffff;
        }
        else {
          box_u->eus_w -= 1;
        }
#else
        if ( -1 == (c3_w)box_u->use_w ) {
          box_u->use_w = 0x80000000;
        }
        else {
          box_u->use_w += 1;
        }
#endif
      }
#endif

      return tot_w;
    }
    else if ( c3n == it_mas ) {
      fprintf(fil_u, "\r\n");

      while ( _(u3du(tt_mas)) ) {
        tot_w += _serf_prof(fil_u, den+2, u3h(tt_mas));
        tt_mas = u3t(tt_mas);
      }

      _serf_space(fil_u, den);
      fprintf(fil_u, "--");
      _serf_print_memory(fil_u, tot_w);

      return tot_w;

    }
    else {
      _serf_space(fil_u, den);
      fprintf(fil_u, "mistyped (strange) mass tail\r\n");
      return tot_w;
    }
  }
}

/* _serf_grab(): garbage collect, checking for profiling. RETAIN.
*/
static void
_serf_grab(void)
{
  if ( u3_nul == u3V.sac) {
    if ( u3C.wag_w & (u3o_debug_ram | u3o_check_corrupt) ) {
      u3m_grab(u3V.sac, u3_none);
    }
  }
  else {
    c3_w tot_w = 0;
    FILE* fil_u;

#ifdef U3_MEMORY_LOG
    {
      u3_noun wen = u3dc("scot", c3__da, u3k(u3A->now));
      c3_c* wen_c = u3r_string(wen);

      c3_c nam_c[2048];
      snprintf(nam_c, 2048, "%s/.urb/put/mass", u3P.dir_c);

      struct stat st;
      if ( -1 == stat(nam_c, &st) ) {
        mkdir(nam_c, 0700);
      }

      c3_c man_c[2048];
      snprintf(man_c, 2048, "%s/%s-serf.txt", nam_c, wen_c);

      fil_u = fopen(man_c, "w");
      fprintf(fil_u, "%s\r\n", wen_c);

      c3_free(wen_c);
      u3z(wen);
    }
#else
    {
      fil_u = stderr;
    }
#endif

    c3_assert( u3R == &(u3H->rod_u) );
    fprintf(fil_u, "\r\n");

    tot_w += u3a_maid(fil_u, "total userspace", _serf_prof(fil_u, 0, u3V.sac));
    tot_w += u3m_mark(fil_u);
    tot_w += u3a_maid(fil_u, "space profile", u3a_mark_noun(u3V.sac));

    u3a_print_memory(fil_u, "total marked", tot_w);
    u3a_print_memory(fil_u, "free lists", u3a_idle(u3R));
    u3a_print_memory(fil_u, "sweep", u3a_sweep());

    fflush(fil_u);

#ifdef U3_MEMORY_LOG
    {
      fclose(fil_u);
    }
#endif

    u3z(u3V.sac);
    u3V.sac = u3_nul;
  }
}

/* _serf_static_grab(): garbage collect, checking for profiling. RETAIN.
*/
static void
_serf_static_grab(void)
{
  c3_assert( u3R == &(u3H->rod_u) );

  fprintf(stderr, "serf: measuring memory:\r\n");
  u3a_print_memory(stderr, "total marked", u3m_mark(stderr));
  u3a_print_memory(stderr, "free lists", u3a_idle(u3R));
  u3a_print_memory(stderr, "sweep", u3a_sweep());
  fprintf(stderr, "\r\n");
  fflush(stderr);
}

/* _serf_pack(): deduplicate and compact memory
*/
static void
_serf_pack(void)
{
  _serf_static_grab();
  u3l_log("serf: compacting loom\r\n");

  if ( c3n == u3m_rock_stay(u3V.dir_c, u3V.dun_d) ) {
    u3l_log("serf: unable to jam state\r\n");
    return;
  }

  if ( c3n == u3e_hold() ) {
    u3l_log("serf: unable to backup checkpoint\r\n");
    return;
  }

  u3m_wipe();

  if ( c3n == u3m_rock_load(u3V.dir_c, u3V.dun_d) ) {
    u3l_log("serf: compaction failed, restoring checkpoint\r\n");

    if ( c3n == u3e_fall() ) {
      fprintf(stderr, "serf: unable to restore checkpoint\r\n");
      c3_assert(0);
    }
  }

  if ( c3n == u3e_drop() ) {
    u3l_log("serf: warning: orphaned backup checkpoint file\r\n");
  }

  if ( c3n == u3m_rock_drop(u3V.dir_c, u3V.dun_d) ) {
    u3l_log("serf: warning: orphaned state file\r\n");
  }

  u3l_log("serf: compacted loom\r\n");
  _serf_static_grab();
}

/* _serf_newt_fail(): failure stub.
*/
static void
_serf_newt_fail(void* vod_p, const c3_c* wut_c)
{
  fprintf(stderr, "serf: fail: %s\r\n", wut_c);
  exit(1);
}

/* _serf_send(): send result back to daemon.
*/
static void
_serf_send(u3_noun job)
{
  u3_newt_write(&u3V.out_u, u3ke_jam(job), 0);
}

/* _serf_send_slog(): send hint output (hod is [priority tank]).
*/
static void
_serf_send_slog(u3_noun hod)
{
  _serf_send(u3nc(c3__slog, hod));
}

/* _serf_send_stdr(): send stderr output
*/
static void
_serf_send_stdr(c3_c* str_c)
{
  _serf_send_slog(u3nc(c3__leaf, u3i_string(str_c)));
}

static void
_serf_sure_post(void)
{
  if ( c3y == u3V.rec_o ) {
    u3m_reclaim();
  }

  //  XX this runs on replay too
  //
  _serf_grab();

  if ( c3y == u3V.pac_o ) {
    _serf_pack();
  }
}

/* _serf_sure_feck(): event succeeded, send effects.
*/
static u3_noun
_serf_sure_feck(c3_w pre_w, u3_noun vir)
{
  //  intercept |mass, observe |reset
  //
  {
    u3_noun riv = vir;
    c3_w    i_w = 0;

    while ( u3_nul != riv ) {
      u3_noun fec = u3t(u3h(riv));

      //  assumes a max of one %mass effect per event
      //
      if ( c3__mass == u3h(fec) ) {
        //  save a copy of the %mass data
        //
        u3V.sac = u3k(u3t(fec));
        //  replace the %mass data with ~
        //
        //    For efficient transmission to daemon.
        //
        riv = u3kb_weld(u3qb_scag(i_w, vir),
                        u3nc(u3nt(u3k(u3h(u3h(riv))), c3__mass, u3_nul),
                             u3qb_slag(1 + i_w, vir)));
        u3z(vir);
        vir = riv;
        break;
      }

      //  reclaim memory from persistent caches on |reset
      //
      if ( c3__vega == u3h(fec) ) {
        u3V.rec_o = c3y;
      }

      //  pack memory on |pack
      //
      if ( c3__pack == u3h(fec) ) {
        u3V.pac_o = c3y;
      }

      riv = u3t(riv);
      i_w++;
    }
  }

  //  after a successful event, we check for memory pressure.
  //
  //    if we've exceeded either of two thresholds, we reclaim
  //    from our persistent caches, and notify the daemon
  //    (via a "fake" effect) that arvo should trim state
  //    (trusting that the daemon will enqueue an appropriate event).
  //    For future flexibility, the urgency of the notification is represented
  //    by a *decreasing* number: 0 is maximally urgent, 1 less so, &c.
  //
  //    high-priority: 2^22 contiguous words remaining (~8 MB)
  //    low-priority:  2^27 contiguous words remaining (~536 MB)
  //    XX maybe use 2^23 (~16 MB) and 2^26 (~268 MB?
  //
  {
    u3_noun pri = u3_none;
    c3_w pos_w = u3a_open(u3R);
    c3_w low_w = (1 << 27);
    c3_w hig_w = (1 << 22);

    if ( (pre_w > low_w) && !(pos_w > low_w) ) {
      //  XX set flag(s) in u3V so we don't repeat endlessly?
      //  XX pack here too?
      //
      u3V.pac_o = c3y;
      u3V.rec_o = c3y;
      pri   = 1;
    }
    else if ( (pre_w > hig_w) && !(pos_w > hig_w) ) {
      u3V.pac_o = c3y;
      u3V.rec_o = c3y;
      pri   = 0;
    }
    //  reclaim memory from persistent caches periodically
    //
    //    XX this is a hack to work two things
    //    - bytecode caches grow rapidly and can't be simply capped
    //    - we don't make very effective use of our free lists
    //
    else {
      u3V.rec_o = _(0 == (u3V.dun_d % 1000ULL));
    }

    //  notify daemon of memory pressure via "fake" effect
    //
    if ( u3_none != pri ) {
      u3_noun cad = u3nc(u3nt(u3_blip, c3__arvo, u3_nul),
                         u3nc(c3__trim, pri));
      vir = u3nc(cad, vir);
    }
  }

  return vir;
}

/* _serf_sure_core(): event succeeded, save state.
*/
static void
_serf_sure_core(u3_noun cor)
{
  u3V.dun_d = u3V.sen_d;

  u3z(u3A->roc);
  u3A->roc   = cor;
  u3A->ent_d = u3V.dun_d;
  u3V.mug_l  = u3r_mug(u3A->roc);
}

#ifdef U3_EVENT_TIME_DEBUG
static void
_serf_poke_time(c3_d evt_d, c3_c* txt_c, struct timeval b4)
{
  struct timeval f2, d0;
  c3_w ms_w;
  c3_w clr_w;

  gettimeofday(&f2, 0);
  timersub(&f2, &b4, &d0);

  ms_w = (d0.tv_sec * 1000) + (d0.tv_usec / 1000);
  clr_w = ms_w > 1000 ? 1 : ms_w < 100 ? 2 : 3; //  red, green, yellow

  if ( clr_w != 2 ) {
    u3l_log("\x1b[3%dm%%%s (%" PRIu64 ") %4d.%02dms\x1b[0m\n",
            clr_w, txt_c, evt_d, ms_w,
            (int) (d0.tv_usec % 1000) / 10);
  }
}
#endif

/* _serf_work():  apply event, capture effects.
*/
static u3_noun
_serf_work(c3_d evt_d, u3_noun job)
{
  u3_noun now, ovo, gon, last_date;
  c3_w pre_w = u3a_open(u3R);

  //  %work must be performed against an extant kernel
  //
  c3_assert( 0 != u3V.mug_l);

  //  event numbers must be continuous (see [%live %walk @])
  //
  c3_assert(evt_d == u3V.dun_d + 1ULL);
  u3V.sen_d = evt_d;

  u3x_cell(job, &now, &ovo);

  last_date = u3A->now;
  u3A->now  = u3k(now);

#ifdef U3_EVENT_TIME_DEBUG
  struct timeval b4;
  c3_t  bug_t = c3__belt != u3h(u3t(ovo));
  c3_c* txt_c = 0;

  if ( bug_t ) {
    gettimeofday(&b4, 0);
    txt_c = u3r_string(u3h(u3t(ovo)));

    u3l_log("serf: %s (%" PRIu64 ") live\r\n", txt_c, evt_d);
  }
#endif

  gon = u3m_soft(0, u3v_poke, u3k(ovo));

#ifdef U3_EVENT_TIME_DEBUG
  if ( bug_t {
    _serf_poke_time(evt_d, txt_c, b4);
    c3_free(txt_c);
  }
#endif

  //  event accepted
  //
  if ( u3_blip == u3h(gon) ) {
    //  vir/(list ovum)  list of effects
    //  cor/arvo         arvo core
    //
    u3_noun vir, cor;
    u3x_trel(gon, 0, &vir, &cor);

    _serf_sure_core(u3k(cor));
    vir = _serf_sure_feck(pre_w, u3k(vir));
    
    u3z(gon); u3z(job); u3z(last_date);

    return u3nt(c3__done, u3i_words(1, &u3V.mug_l), vir);
  }

  //  event rejected
  //
  {
    //  stash $goof from first crash
    //
    u3_noun dud = u3k(u3t(gon));

    //  replace [ovo] with error notification
    //
    {
      u3_noun wir, cad, dud;
      u3x_cell(ovo, &wir, &cad);
      ovo = u3nq(u3k(wir), c3__crud, u3k(dud), u3k(cad));
    }

    // XX reclaim/pack on %meme first?
    //

    // XX u3i_vint(u3A->now) ??
    //

#ifdef U3_EVENT_TIME_DEBUG
    if ( bug_t ) {
      gettimeofday(&b4, 0);
      u3l_log("serf: crud (%" PRIu64 ") live\r\n", evt_d);
    }
#endif

    u3z(gon);
    gon = u3m_soft(0, u3v_poke, u3k(ovo));

#ifdef U3_EVENT_TIME_DEBUG
    if ( bug_t {
      _serf_poke_time(evt_d, "crud", b4);
    }
#endif

    //  error notification accepted
    //
    if ( u3_blip == u3h(gon) ) {
      //  vir/(list ovum)  list of effects
      //  cor/arvo         arvo core
      //
      u3_noun vir, cor;
      u3x_trel(gon, 0, &vir, &cor);

      _serf_sure_core(u3k(cor));
      vir = _serf_sure_feck(pre_w, u3k(vir));

      u3z(gon); u3z(job); u3z(last_date); u3z(dud);

      return u3nq(c3__swap, u3i_words(1, &u3V.mug_l),
                            u3nc(u3k(u3A->now), ovo),
                            vir);
    }

    //  error notification rejected
    //
    {
      //  stash $goof from second crash
      //
      u3_noun dud = u3k(u3t(gon));

      //  restore previous time
      //
      u3z(u3A->now);
      u3A->now = last_date;

      u3V.sen_d = u3V.dun_d;

      u3z(gon); u3z(job); u3z(ovo);

      // XX reclaim/pack on %meme ?
      //

      return u3nq(c3__bail, u3k(u3t(gon)), dud, u3_nul);
    }
  }
}

/* _serf_work_trace(): %work, with trace
*/
static u3_noun
_serf_work_trace(c3_d evt_d, u3_noun job)
{
  c3_t  tac_t = ( 0 != u3_Host.tra_u.fil_u );
  c3_c  lab_c[2048];
  u3_noun pro;

  // XX refactor tracing
  //
  if ( tac_t ) {
    u3_noun wir = u3h(u3t(job));
    u3_noun cad = u3h(u3t(u3t(job)));

    {
      c3_c* cad_c = u3m_pretty(cad);
      c3_c* wir_c = u3m_pretty_path(wir);
      snprintf(lab_c, 2048, "event %" PRIu64 ": [%s %s]",
                            evt_d, wir_c, cad_c);
      c3_free(cad_c);
      c3_free(wir_c);
    }

    u3t_event_trace(lab_c, 'B');
  }

  pro = _serf_work(evt_d, job);

  if ( tac_t ) {
    u3t_event_trace(lab_c, 'E');
  }

  return pro;
}

static u3_noun
_serf_play_life(u3_noun eve)
{
  c3_d len_d;
  {
    u3_noun len = u3qb_lent(eve);

    c3_assert( 1 == u3r_met(6, len) );
    len_d = u3r_chub(1, len);
  }

  //  XX set evt_d forall lit so that %slog is accurate?
  //  XX capture bail instead of exit
  //
  if ( c3n == u3v_boot(eve) ) {
    fprintf(stderr, "serf: boot failed: invalid sequence (from pill)\r\n");
    exit(1);
  }

  u3V.dun_d = u3V.sen_d = u3A->ent_d = len_d;
  u3V.mug_l = u3r_mug(u3A->roc);

  u3l_log("serf: (%" PRIu64 ")| core: %x\r\n", u3V.dun_d, u3V.mug_l);

  return u3nc(c3__done, u3V.mug_l);
}

static u3_noun
_serf_play_list(u3_noun eve)
{
  c3_w pre_w = u3a_open(u3R);
  u3_noun vev = eve;
  u3_noun job, now, ovo, gon, last_date;

  while ( u3_nul != eve ) {
    job = u3h(eve);
    u3x_cell(job, &now, &ovo);

    last_date = u3A->now;
    u3A->now  = u3k(now);
    u3V.sen_d++;

    gon = u3m_soft(0, u3v_poke, u3k(ovo));

    if ( u3_blip != u3h(gon) ) {
      u3_noun dud = u3k(u3t(gon));
      u3z(gon);

      //  restore previous time
      //
      u3z(u3A->now);
      u3A->now = last_date;

      u3V.sen_d = u3V.dun_d;
      u3z(vev);

      //  XX reclaim/pack on meme
      //  XX retry?
      //

      return u3nc(c3__bail, dud);
    }
    else {
      //  vir/(list ovum)  list of effects
      //  cor/arvo         arvo core
      //
      u3_noun vir, cor;
      u3x_trel(gon, 0, &vir, &cor);

      _serf_sure_core(u3k(cor));

      //  process effects to set pack/reclaim flags
      //
      u3z(_serf_sure_feck(pre_w, u3k(vir)));
      u3z(gon);

      //  skip |mass on replay
      u3z(u3V.sac);
      u3V.sac = u3_nul;

      eve = u3t(eve);
    }
  }

  u3z(vev);
  return u3nc(c3__done, u3V.mug_l);
}

/* _serf_play(): apply events.
*/
static u3_noun
_serf_play(c3_d evt_d, u3_noun lit)
{
  c3_assert( evt_d == 1ULL + u3V.sen_d );

  //  XX better condition for no kernel?
  //
  u3_noun pro = ( 0ULL == u3V.dun_d )
                ? _serf_play_life(lit)
                : _serf_play_list(lit);

  return u3nt(c3__play, u3i_chubs(1, &u3V.dun_d), pro);
}

// /* _serf_poke_peek(): dereference namespace.
// */
// static void
// _serf_poke_peek(u3_noun now, u3_noun pat)
// {
//   // XX u3v_peek
// }

/* _serf_live_exit(): exit on command.
*/
static void
_serf_live_exit(c3_w cod_w)
{
  if ( u3C.wag_w & u3o_debug_cpu ) {
    FILE* fil_u;

    {
      u3_noun wen = u3dc("scot", c3__da, u3k(u3A->now));
      c3_c* wen_c = u3r_string(wen);

      c3_c nam_c[2048];
      snprintf(nam_c, 2048, "%s/.urb/put/profile", u3P.dir_c);

      struct stat st;
      if ( -1 == stat(nam_c, &st) ) {
        mkdir(nam_c, 0700);
      }

      c3_c man_c[2048];
      snprintf(man_c, 2048, "%s/%s.txt", nam_c, wen_c);

      fil_u = fopen(man_c, "w");

      c3_free(wen_c);
      u3z(wen);
    }

    u3t_damp(fil_u);

    {
      fclose(fil_u);
    }
  }

  //  XX move to jets.c
  //
  c3_free(u3D.ray_u);

  exit(cod_w);
}

/* _serf_live_save(): save snapshot.
*/
static void
_serf_live_save(c3_d evt_d)
{
  c3_assert( evt_d == u3V.dun_d );
  u3e_save();
}

/* _serf_live_walk(): bump event number.
*/
static void
_serf_live_walk(c3_d evt_d)
{
  u3l_log("serf: bump %" PRIu64 " to %" PRIu64 "\r\n", u3V.dun_d, evt_d);
  u3V.sen_d = u3V.dun_d = evt_d;
}

// XX move to u3r
//

static c3_o
_r_safe_byte(u3_noun dat, c3_y* out_y) {
  if ( (c3n == u3a_is_atom(dat)) ||
       (1 < u3r_met(3, dat)) )
  {
    return c3n;
  }

  *out_y = u3r_byte(0, dat);
  return c3y;
}

static c3_o
_r_safe_word(u3_noun dat, c3_w* out_w) {
  if ( (c3n == u3a_is_atom(dat)) ||
       (1 < u3r_met(5, dat)) )
  {
    return c3n;
  }

  *out_w = u3r_word(0, dat);
  return c3y;
}

static c3_o
_r_safe_chub(u3_noun dat, c3_d* out_d) {
  if ( (c3n == u3a_is_atom(dat)) ||
       (1 < u3r_met(6, dat)) )
  {
    return c3n;
  }

  *out_d = u3r_chub(0, dat);
  return c3y;
}

/* _serf_step_trace(): initialize or rotate trace file.
*/
static void
_serf_step_trace(void)
{
  if ( u3C.wag_w & u3o_trace ) {
    if ( u3_Host.tra_u.con_w == 0  && u3_Host.tra_u.fun_w == 0 ) {
      u3t_trace_open(u3V.dir_c);
    }
    else if ( u3_Host.tra_u.con_w >= 100000 ) {
      u3t_trace_close();
      u3t_trace_open(u3V.dir_c);
    }
  }
}

/* _serf_poke():
*/
void
_serf_newt_poke(void* vod_p, u3_noun mat)
{
  u3_noun jar = u3ke_cue(mat);

  if ( c3n == u3a_is_cell(jar) ) {
    goto error;
  }

  _serf_step_trace();

  switch ( u3h(jar) ) {
    default: {
      goto error;
    }

    case c3__live: {
      u3_noun com, dat;

      if ( c3n == u3r_trel(jar, 0, &com, &dat) ) {
        goto error;
      }

      switch (com) {
        default: {
          goto error;
        }

        case c3__exit: {
          c3_y cod_y;

          if ( c3n == _r_safe_byte(dat, &cod_y) ) {
            goto error;
          }

          u3z(jar);
          _serf_live_exit(cod_y);
          return;
        }

        case c3__save: {
          c3_d evt_d;

          if ( c3n == _r_safe_chub(dat, &evt_d) ) {
            goto error;
          }

          u3z(jar);
          _serf_live_save(evt_d);
          return;
        }

        case c3__walk: {
          c3_d evt_d;

          if ( c3n == _r_safe_chub(dat, &evt_d) ) {
            goto error;
          }

          u3z(jar);
          _serf_live_walk(evt_d);
          return;
        }
      }
    }

    // case c3__peek: {
    //   u3_noun now, pat;

    //   if ( (c3n == u3r_trel(jar, 0, &now, &pat)) ||
    //        (c3n == u3a_is_cell(pat)) ||
    //        (c3n == u3a_is_atom(now)) ||
    //        (1 != u3r_met(8, now)) )
    //   {
    //     goto error;
    //   }

    //   u3k(now); u3k(pat);
    //   u3z(jar);

    //   return _serf_poke_peek(now, pat);
    // }

    case c3__play: {
      u3_noun evt, lit;
      c3_d evt_d;

      if ( (c3n == u3r_trel(jar, 0, &evt, &lit)) ||
           (c3n == u3a_is_cell(lit)) ||
           (c3n == _r_safe_chub(evt, &evt_d)) )
      {
        goto error;
      }

      u3k(lit);
      u3z(jar);
      _serf_send(_serf_play(evt_d, lit));
      _serf_sure_post();
      return;
    }

    case c3__work: {
      u3_noun evt, job;
      c3_d evt_d;

      if ( (c3n == u3r_trel(jar, 0, &evt, &job)) ||
           (c3n == u3a_is_cell(job)) ||
           (c3n == _r_safe_chub(evt, &evt_d)) )
      {
        goto error;
      }

      u3k(job);
      u3z(jar);
      _serf_send(_serf_work_trace(evt_d, job));
      _serf_sure_post();
      return;
    }
  }

  error: {
    u3z(jar);
    _serf_newt_fail(0, "bad jar");
  }
}

/* _serf_ripe(): produce initial serf state as [eve=@ mug=@]
*/
static u3_noun
_serf_ripe(void)
{
  u3l_log("serf: ripe %" PRIu64 "\r\n", u3V.dun_d);

  u3V.mug_l = ( 0 == u3V.dun_d ) ? 0 : u3r_mug(u3A->roc);
  return u3nc(u3i_chubs(1, &u3V.dun_d), u3i_words(1, &u3V.mug_l));
}

/* u3_serf_boot(): send startup message to manager.
*/
void
u3_serf_boot(void)
{
  c3_w  pro_w = 1;
  u3_noun kel = u3nt(u3nc(c3__hoon, 141),
                     u3nc(c3__nock, 4),
                     u3_nul);

  _serf_send(u3nq(c3__ripe, pro_w, kel, _serf_ripe()));

  //  measure/print static memory usage if < 1/2 of the loom is available
  //
  {
    c3_w pen_w = u3a_open(u3R);

    if ( !(pen_w > (1 << 28)) ) {
      fprintf(stderr, "\r\n");
      u3a_print_memory(stderr, "serf: contiguous free space", pen_w);
      _serf_static_grab();
    }
  }

  u3V.pac_o = c3n;
  u3V.rec_o = c3n;
  u3V.sac   = u3_nul;
}

/* main(): main() when run as urbit-worker
*/
c3_i
mmain(c3_i argc, c3_c* argv[])
{
  //  the serf is spawned with [FD 0] = events and [FD 1] = effects
  //  we dup [FD 0 & 1] so we don't accidently use them for something else
  //  we replace [FD 0] (stdin) with a fd pointing to /dev/null
  //  we replace [FD 1] (stdout) with a dup of [FD 2] (stderr)
  //
  c3_i nul_i = open("/dev/null", O_RDWR, 0);
  c3_i inn_i = dup(0);
  c3_i out_i = dup(1);
  dup2(nul_i, 0);
  dup2(2, 1);
  close(nul_i);

  uv_loop_t* lup_u = uv_default_loop();
  c3_c*      dir_c = argv[1];
  c3_c*      key_c = argv[2];
  c3_c*      wag_c = argv[3];

  c3_assert(4 == argc);

  memset(&u3V, 0, sizeof(u3V));
  memset(&u3_Host.tra_u, 0, sizeof(u3_Host.tra_u));

  /* load passkey
  */
  {
    sscanf(key_c, "%" PRIx64 ":%" PRIx64 ":%" PRIx64 ":%" PRIx64 "",
                  &u3V.key_d[0],
                  &u3V.key_d[1],
                  &u3V.key_d[2],
                  &u3V.key_d[3]);
  }

  /* load runtime config
  */
  {
    sscanf(wag_c, "%" SCNu32, &u3C.wag_w);
  }

  /* load pier directory
  */
  {
    u3V.dir_c = strdup(dir_c);
  }

  /* boot image
  */
  {
    u3V.sen_d = u3V.dun_d = u3m_boot(dir_c);
    u3C.stderr_log_f = _serf_send_stdr;
    u3C.slog_f = _serf_send_slog;
  }

  //  Ignore SIGPIPE signals.
  //
  {
    struct sigaction sig_s = {{0}};
    sigemptyset(&(sig_s.sa_mask));
    sig_s.sa_handler = SIG_IGN;
    sigaction(SIGPIPE, &sig_s, 0);
  }

  /* configure pipe to daemon process
  */
  {
    c3_i err_i;

    err_i = uv_pipe_init(lup_u, &u3V.inn_u.pyp_u, 0);
    c3_assert(!err_i);
    uv_pipe_open(&u3V.inn_u.pyp_u, inn_i);

    err_i = uv_pipe_init(lup_u, &u3V.out_u.pyp_u, 0);
    c3_assert(!err_i);
    uv_pipe_open(&u3V.out_u.pyp_u, out_i);
  }

  /* set up writing
  */
  u3V.out_u.bal_f = _serf_newt_fail;

  /* start reading
  */
  u3V.inn_u.vod_p = &u3V;
  u3V.inn_u.pok_f = _serf_newt_poke;
  u3V.inn_u.bal_f = _serf_newt_fail;

  u3_newt_read(&u3V.inn_u);

  /* send start request
  */
  u3_serf_boot();

  /* enter loop
  */
  uv_run(lup_u, UV_RUN_DEFAULT);
  return 0;
}