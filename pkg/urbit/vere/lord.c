/* vere/lord.c
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

#include "all.h"
#include "vere/vere.h"

/*
|%
::  +writ: from king to serf
::
+$  writ
  $%  $:  %live
          $%  [%exit cod=@]
              [%save eve=@]
              [%snap eve=@]
      ==  ==
      [%peek now=date lyc=gang pat=path]
      [%play eve=@ lit=(list ?((pair date ovum) *))]
      [%work job=(pair date ovum)]
  ==
::  +plea: from serf to king
::
+$  plea
  $%  [%live ~]
      [%ripe [pro=@ hon=@ nok=@] eve=@ mug=@]
      [%slog pri=@ =tank]
      [%peek dat=(unit (cask))]
      $:  %play
          $%  [%done mug=@]
              [%bail eve=@ mug=@ dud=goof]
      ==  ==
      $:  %work
          $%  [%done eve=@ mug=@ fec=(list ovum)]
              [%swap eve=@ mug=@ job=(pair date ovum) fec=(list ovum)]
              [%bail lud=(list goof)]
      ==  ==
  ==
--
*/

#undef VERBOSE_LORD

/* _lord_writ_pop(): pop the writ stack
*/
static u3_rrit*
_lord_writ_pop(u3_lord* god_u)
{
  u3_rrit* wit_u = god_u->ext_u;

  c3_assert( wit_u );

  if ( !wit_u->nex_u ) {
    god_u->ent_u = god_u->ext_u = 0;
  }
  else {
    god_u->ext_u = wit_u->nex_u;
    wit_u->nex_u = 0;
  }

  god_u->dep_w--;

  return wit_u;
}

/* _lord_writ_need(): require mote
*/
static u3_rrit*
_lord_writ_need(u3_lord* god_u, c3_m ned_m)
{
  u3_rrit* wit_u = _lord_writ_pop(god_u);

  if ( ned_m != wit_u->typ_m ) {
    fprintf(stderr, "lord: unexpected %%%.4s, expected %%%.4s\r\n",
                                              (c3_c*)&wit_u->typ_m,
                                              (c3_c*)&ned_m);
    u3_pier_bail();
    exit(1);
  }

  return wit_u;
}

/* _lord_on_k(): handle subprocess exit.
*/
static void
_lord_on_exit(uv_process_t* req_u,
              c3_ds         sas_i,
              c3_i          sig_i)
{
  u3_lord* god_u = (void*)req_u;
  c3_w     xit_w;
  {
    u3_rrit* wit_u =_lord_writ_need(god_u, c3__exit);
    xit_w = wit_u->xit_w;
    c3_free(wit_u);
  }

  {
    void (*exit_f)(void*, c3_o) = god_u->cb_u.exit_f;
    void* vod_p = god_u->cb_u.vod_p;
    //  XX correct comparison?
    //
    c3_o  ret_o = ( xit_w == sas_i ) ? c3y : c3n;

    //  XX dispose god_u
    //
    exit_f(vod_p, c3y);
  }
}

/* _lord_bail_noop(): ignore subprocess error on shutdown
*/
static void
_lord_bail_noop(void*       vod_p,
                const c3_c* err_c)
{
}

/* _lord_bail(): handle subprocess error.
*/
static void
_lord_bail(void*       vod_p,
           const c3_c* err_c)
{
  // XX exit?
  //
  fprintf(stderr, "\rpier: work error: %s\r\n", err_c);
}

static void
_lord_plea_foul(u3_lord* god_u, c3_m mot_m, u3_noun dat)
{
  if ( u3_blip == mot_m ) {
    fprintf(stderr, "lord: received invalid $plea\r\n");
  }
  else {
    fprintf(stderr, "lord: received invalid %%%.4s $plea\r\n", (c3_c*)&mot_m);
  }

  u3m_p("plea", dat);
  u3_pier_bail();
  exit(1);
}

/* _lord_plea_live(): hear serf %live ack
*/
static void
_lord_plea_live(u3_lord* god_u, u3_noun dat)
{
  u3_rrit* wit_u = _lord_writ_pop(god_u);

  if( u3_nul != dat ) {
    return _lord_plea_foul(god_u, c3__live, dat);
  }

  switch ( wit_u->typ_m ) {
    default: {
      fprintf(stderr, "lord: unexpected %%live, expected %%%.4s\r\n",
                                          (c3_c*)&wit_u->typ_m);
      u3_pier_bail();
      exit(1);
    }
    c3_assert(!"unreachable");

    case c3__save: {
      god_u->cb_u.save_f(god_u->cb_u.vod_p, wit_u->eve_d);
      break;
    }
    c3_assert(!"unreachable");

    case c3__snap: {
      god_u->cb_u.snap_f(god_u->cb_u.vod_p, wit_u->eve_d);
      break;
    }
    c3_assert(!"unreachable");
  }

  c3_free(wit_u);
}

/* _lord_plea_ripe(): hear serf startup state
*/
static void
_lord_plea_ripe(u3_lord* god_u, u3_noun dat)
{
  if ( c3y == god_u->liv_o ) {
    fprintf(stderr, "lord: received unexpected %%ripe\n");
    u3_pier_bail();
    exit(1);
  }

  {
    u3_noun ver, pro, hon, noc, eve, mug;
    c3_y pro_y, hon_y, noc_y;
    c3_d eve_d;
    c3_l mug_l;

    if (  (c3n == u3r_trel(dat, &ver, &eve, &mug))
       || (c3n == u3r_trel(ver, &pro, &hon, &noc))
       || (c3n == u3r_safe_byte(pro, &pro_y))
       || (c3n == u3r_safe_byte(hon, &hon_y))
       || (c3n == u3r_safe_byte(noc, &noc_y))
       || (c3n == u3r_safe_chub(eve, &eve_d))
       || (c3n == u3r_safe_word(mug, &mug_l)) )
    {
      return _lord_plea_foul(god_u, c3__ripe, dat);
    }

    if ( 1 != pro_y ) {
      fprintf(stderr, "pier: unsupported ipc protocol version %u\r\n", pro_y);
      u3_pier_bail();
      exit(1);
    }

#ifdef VERBOSE_LORD
    fprintf(stderr, "pier: (%" PRIu64 "): ripe at mug %x\r\n", eve_d, mug_l);
#endif

    god_u->eve_d = eve_d;
    god_u->mug_l = mug_l;
    god_u->hon_y = hon_y;
    god_u->noc_y = noc_y;
  }

  god_u->liv_o = c3y;
  god_u->cb_u.live_f(god_u->cb_u.vod_p);

  u3z(dat);
}

/* _lord_plea_slog(): hear serf debug output 
*/
static void
_lord_plea_slog(u3_lord* god_u, u3_noun dat)
{
  u3_noun pri, tan;
  c3_w pri_w;

  if (  (c3n == u3r_cell(dat, &pri, &tan))
     || (c3n == u3r_safe_word(pri, &pri_w)) )
  {
    return _lord_plea_foul(god_u, c3__slog, dat);
  }

  //  XX per-writ slog_f?
  //

  god_u->cb_u.slog_f(god_u->cb_u.vod_p, pri_w, u3k(tan));
  u3z(dat);
}

/* _lord_plea_peek(): hear serf %peek response
*/
static void
_lord_plea_peek(u3_lord* god_u, u3_noun dat)
{
  u3_peek* pek_u;
  {
    u3_rrit* wit_u = _lord_writ_need(god_u, c3__peek);
    pek_u = wit_u->pek_u;
    c3_free(wit_u);
  }

  god_u->cb_u.peek_f(god_u->cb_u.vod_p, pek_u->gan, pek_u->pat, dat);
}

/* _lord_plea_play(): hear serf %play response
*/
static void
_lord_plea_play(u3_lord* god_u, u3_noun dat)
{
  u3_play pay_u;
  {
    u3_rrit* wit_u = _lord_writ_need(god_u, c3__play);
    pay_u = wit_u->pay_u;
    c3_free(wit_u);
  }

  if ( c3n == u3a_is_cell(dat) ) {
    return _lord_plea_foul(god_u, c3__play, dat);
  }

  switch ( u3h(dat) ) {
    default: {
      return _lord_plea_foul(god_u, c3__play, dat);
    }
    c3_assert(!"unreachable");

    case c3__bail: {
      u3_noun eve, mug, dud;
      c3_d eve_d;
      c3_l mug_l;

      if (  (c3n == u3r_trel(u3t(dat), &eve, &mug, &dud))
         || (c3n == u3r_safe_chub(eve, &eve_d))
         || (c3n == u3r_safe_word(mug, &mug_l))
         || (c3n == u3a_is_cell(dud)) )
      {
        return _lord_plea_foul(god_u, c3__play, dat);
      }

      god_u->eve_d = (eve_d - 1ULL);
      god_u->mug_l = mug_l;

      god_u->cb_u.play_bail_f(god_u->cb_u.vod_p,
                              pay_u, mug_l, eve_d, u3k(dud));
      break;
    }
    c3_assert(!"unreachable");

    case c3__done: {
      c3_l mug_l;

      if ( c3n == u3r_safe_word(u3t(dat), &mug_l) ) {
        return _lord_plea_foul(god_u, c3__play, dat);
      }

      god_u->eve_d = pay_u.ent_u->eve_d;
      god_u->mug_l = mug_l;

      god_u->cb_u.play_done_f(god_u->cb_u.vod_p, pay_u, mug_l);
      break;
    }
    c3_assert(!"unreachable");
  }

  u3z(dat);
}

/* _lord_plea_work(): hear serf %work response
*/
static void
_lord_plea_work(u3_lord* god_u, u3_noun dat)
{
  u3_work* wok_u;
  {
    u3_rrit*  wit_u = _lord_writ_need(god_u, c3__work);
    wok_u = wit_u->wok_u;
    c3_free(wit_u);
  }

  if ( c3n == u3a_is_cell(dat) ) {
    return _lord_plea_foul(god_u, c3__work, dat);
  }

  switch ( u3h(dat) ) {
    default: {
      return _lord_plea_foul(god_u, c3__work, dat);
    }
    c3_assert(!"unreachable");

    case c3__bail: {
      u3_noun lud = u3t(dat);

      if ( god_u->ext_u
           && wok_u->bug_l
           && ( c3__work == god_u->ext_u->typ_m ) )
      {
        god_u->ext_u->wok_u->bug_l = wok_u->bug_l;
      }

      god_u->cb_u.work_bail_f(god_u->cb_u.vod_p, wok_u, u3k(lud));
      break;
    }
    c3_assert(!"unreachable");

    case c3__swap: {
      u3_noun eve, mug, job, fec;
      c3_d eve_d;
      c3_l mug_l;

      if (  (c3n == u3r_qual(u3t(dat), &eve, &mug, &job, &fec))
         || (c3n == u3r_safe_chub(eve, &eve_d))
         || (c3n == u3r_safe_word(mug, &mug_l))
         || (c3n == u3a_is_cell(job)) )
      {
        return _lord_plea_foul(god_u, c3__work, dat);
      }

      wok_u->eve_d = god_u->eve_d = eve_d;
      wok_u->mug_l = god_u->mug_l = mug_l;
      u3z(wok_u->job);
      wok_u->job   = u3k(job);
      wok_u->act   = u3k(fec);

      if ( god_u->ext_u && ( c3__work == god_u->ext_u->typ_m ) ) {
        god_u->ext_u->wok_u->bug_l = mug_l;
      }

      god_u->cb_u.work_done_f(god_u->cb_u.vod_p, wok_u, c3y);
      break;
    }
    c3_assert(!"unreachable");

    case c3__done: {
      u3_noun eve, mug, fec;
      c3_d eve_d;
      c3_l mug_l;

      if (  (c3n == u3r_trel(u3t(dat), &eve, &mug, &fec))
         || (c3n == u3r_safe_chub(eve, &eve_d))
         || (c3n == u3r_safe_word(mug, &mug_l)) )
      {
        return _lord_plea_foul(god_u, c3__work, dat);
      }

      wok_u->eve_d = god_u->eve_d = eve_d;
      wok_u->mug_l = god_u->mug_l = mug_l;
      wok_u->act   = u3k(fec);

      if ( god_u->ext_u && ( c3__work == god_u->ext_u->typ_m ) ) {
        god_u->ext_u->wok_u->bug_l = mug_l;
      }

      god_u->cb_u.work_done_f(god_u->cb_u.vod_p, wok_u, c3n);
      break;
    }
    c3_assert(!"unreachable");
  }

  u3z(dat);
}

/* _lord_poke(): handle subprocess result.
*/
static void
_lord_poke(void*   vod_p,
           u3_noun   mat)
{
  u3_lord* god_u = vod_p;
  u3_noun    jar = u3ke_cue(mat);
  u3_noun    tag, dat;

  if ( c3n == u3r_cell(jar, &tag, &dat) ) {
    goto error;
  }

  switch ( tag ) {
    default: goto error;

    case c3__live: {
      _lord_plea_live(god_u, u3k(dat));
      break;
    }
    c3_assert(!"unreachable");

    case c3__ripe: {
      _lord_plea_ripe(god_u, u3k(dat));
      break;
    }
    c3_assert(!"unreachable");

    case  c3__slog: {
      _lord_plea_slog(god_u, u3k(dat));
      break;
    }
    c3_assert(!"unreachable");

    case c3__peek: {
      _lord_plea_peek(god_u, u3k(dat));
      break;
    }
    c3_assert(!"unreachable");

    case c3__play: {
      _lord_plea_play(god_u, u3k(dat));
      break;
    }
    c3_assert(!"unreachable");

    case c3__work: {
      _lord_plea_work(god_u, u3k(dat));
      break;
    }
    c3_assert(!"unreachable");
  }

  u3z(jar);
  return;

  error: {
    u3m_p("jar", jar);
    u3z(jar);
    _lord_bail(0, "bad jar");
  }
}

/* u3_lord_init(): instantiate child process.
*/
u3_lord*
u3_lord_init(c3_c* pax_c, c3_w wag_w, c3_d key_d[4], u3_lord_cb cb_u)
{
  u3_lord* god_u = c3_calloc(sizeof *god_u);
  god_u->liv_o = c3n;
  god_u->wag_w = wag_w;
  god_u->bin_c = u3_Host.wrk_c; //  XX strcopy
  god_u->pax_c = pax_c;  //  XX strcopy
  god_u->cb_u  = cb_u;

  god_u->key_d[0] = key_d[0];
  god_u->key_d[1] = key_d[1];
  god_u->key_d[2] = key_d[2];
  god_u->key_d[3] = key_d[3];

  //  spawn new process and connect to it
  //
  {
    c3_c* arg_c[5];
    c3_c  key_c[256];
    c3_c  wag_c[11];
    c3_i  err_i;

    sprintf(key_c, "%" PRIx64 ":%" PRIx64 ":%" PRIx64 ":%" PRIx64 "",
                   god_u->key_d[0],
                   god_u->key_d[1],
                   god_u->key_d[2],
                   god_u->key_d[3]);

    sprintf(wag_c, "%u", god_u->wag_w);

    arg_c[0] = god_u->bin_c;            //  executable
    arg_c[1] = god_u->pax_c;            //  path to checkpoint directory
    arg_c[2] = key_c;                   //  disk key
    arg_c[3] = wag_c;                   //  runtime config
    arg_c[4] = 0;

    uv_pipe_init(u3L, &god_u->inn_u.pyp_u, 0);
    uv_pipe_init(u3L, &god_u->out_u.pyp_u, 0);

    god_u->cod_u[0].flags = UV_CREATE_PIPE | UV_READABLE_PIPE;
    god_u->cod_u[0].data.stream = (uv_stream_t *)&god_u->inn_u;

    god_u->cod_u[1].flags = UV_CREATE_PIPE | UV_WRITABLE_PIPE;
    god_u->cod_u[1].data.stream = (uv_stream_t *)&god_u->out_u;

    god_u->cod_u[2].flags = UV_INHERIT_FD;
    god_u->cod_u[2].data.fd = 2;

    god_u->ops_u.stdio = god_u->cod_u;
    god_u->ops_u.stdio_count = 3;

    god_u->ops_u.exit_cb = _lord_on_exit;
    god_u->ops_u.file = arg_c[0];
    god_u->ops_u.args = arg_c;

    if ( (err_i = uv_spawn(u3L, &god_u->cub_u, &god_u->ops_u)) ) {
      fprintf(stderr, "spawn: %s: %s\r\n", arg_c[0], uv_strerror(err_i));

      return 0;
    }
  }

  //  start reading from proc
  //
  {
    god_u->out_u.vod_p = god_u;
    god_u->out_u.pok_f = _lord_poke;
    god_u->out_u.bal_f = _lord_bail;

    //  XX distinguish from out_u.bal_f ?
    //
    god_u->inn_u.bal_f = _lord_bail;

    u3_newt_read(&god_u->out_u);
  }
  return god_u;
}

/* _lord_writ_new();
*/
static u3_rrit* 
_lord_writ_new(u3_lord* god_u)
{
  u3_rrit* wit_u = c3_calloc(sizeof(*wit_u));
  wit_u->sen_o = c3n;
  wit_u->mat   = 0;
  wit_u->nex_u = 0;
  gettimeofday(&wit_u->tim_tv, 0);

  return wit_u;
}

/* _lord_writ_jam();
*/
static void
_lord_writ_jam(u3_lord* god_u, u3_rrit* wit_u)
{
  if ( 0 == wit_u->mat ) {
    u3_noun msg;

    switch ( wit_u->typ_m ) {
      default: c3_assert(0);

      case c3__exit: {
        //  XX u3_newt_close on send
        //
        msg = u3nt(c3__live, c3__exit, u3i_words(1, &wit_u->xit_w));
        break;
      }
      c3_assert(!"unreachable");

      case c3__save: {
        if ( !wit_u->eve_d ) {
          wit_u->eve_d = god_u->eve_d;
        }

#ifdef VERBOSE_LORD
        fprintf(stderr, "lord: (%" PRIu64 "): send save\r\n", wit_u->eve_d);
#endif

        msg = u3nt(c3__live, c3__save, u3i_chubs(1, &wit_u->eve_d));
        break;
      }
      c3_assert(!"unreachable");

      case c3__snap: {
        if ( !wit_u->eve_d ) {
          wit_u->eve_d = god_u->eve_d;
        }

#ifdef VERBOSE_LORD
        fprintf(stderr, "lord: (%" PRIu64 "): send save\r\n", wit_u->eve_d);
#endif

        msg = u3nt(c3__live, c3__snap, u3i_chubs(1, &wit_u->eve_d));
        break;
      }
      c3_assert(!"unreachable");

      case c3__peek: {
        c3_assert(0);
      }
      c3_assert(!"unreachable");

      case c3__play: {
        u3_fact* tac_u = wit_u->pay_u.ext_u;
        c3_d     eve_d = tac_u->eve_d;
        u3_noun    lit = u3_nul;

        while ( tac_u ) {
          lit   = u3nc(u3k(tac_u->job), lit);
          tac_u = tac_u->nex_u;
        }

        msg = u3nt(c3__play, u3i_chubs(1, &eve_d), u3kb_flop(lit));
        break;
      }
      c3_assert(!"unreachable");

      case c3__work: {
        msg = u3nc(c3__work, u3k(wit_u->wok_u->job));
        break;
      }
      c3_assert(!"unreachable");
    }

    wit_u->mat = u3ke_jam(msg);
  }
}

/* _lord_writ_send();
*/
static void
_lord_writ_send(u3_lord* god_u, u3_rrit* wit_u)
{
  if ( c3n == wit_u->sen_o ) {
    _lord_writ_jam(god_u, wit_u);
    u3_newt_write(&god_u->inn_u, wit_u->mat, 0);
    wit_u->sen_o = c3y;
    wit_u->mat   = 0;

    //  ignore subprocess error on shutdown
    //
    if ( c3__exit == wit_u->typ_m ) {
      god_u->out_u.bal_f = _lord_bail_noop;
      god_u->inn_u.bal_f = _lord_bail_noop;
    }
  }
}

/* _lord_writ_plan();
*/
static void
_lord_writ_plan(u3_lord* god_u, u3_rrit* wit_u)
{
  if ( !god_u->ent_u ) {
    c3_assert( !god_u->ext_u );
    c3_assert( !god_u->dep_w );
    god_u->dep_w = 1;
    god_u->ent_u = god_u->ext_u = wit_u;
  }
  else {
    god_u->dep_w++;
    god_u->ent_u->nex_u = wit_u;
    god_u->ent_u = wit_u;
  }

  _lord_writ_send(god_u, wit_u);
}

/* u3_lord_exit();
*/
void
u3_lord_exit(u3_lord* god_u, c3_w cod_w)
{
  u3_rrit* wit_u = _lord_writ_new(god_u);
  wit_u->typ_m = c3__exit;
  wit_u->xit_w = cod_w;

  _lord_writ_plan(god_u, wit_u);
}

/* u3_lord_save();
*/
void
u3_lord_save(u3_lord* god_u, c3_d eve_d)
{
  u3_rrit* wit_u = _lord_writ_new(god_u);
  wit_u->typ_m = c3__save;
  wit_u->eve_d = eve_d;
  
  _lord_writ_plan(god_u, wit_u);
}

/* u3_lord_snap();
*/
void
u3_lord_snap(u3_lord* god_u, c3_d eve_d)
{
  u3_rrit* wit_u = _lord_writ_new(god_u);
  wit_u->typ_m = c3__snap;
  wit_u->eve_d = eve_d;

  _lord_writ_plan(god_u, wit_u);
}

/* u3_lord_peek();
*/
void
u3_lord_peek(u3_lord* god_u, u3_noun gan, u3_noun pat)
{
  u3_rrit* wit_u = _lord_writ_new(god_u);
  wit_u->typ_m = c3__peek;
  wit_u->pek_u = c3_malloc(sizeof(*wit_u->pek_u));
  wit_u->pek_u->now = u3_time_in_tv(&wit_u->tim_tv);
  wit_u->pek_u->gan = gan;
  wit_u->pek_u->pat = pat;

  _lord_writ_plan(god_u, wit_u);
}

/* u3_lord_play();
*/
void
u3_lord_play(u3_lord* god_u, u3_play pay_u)
{
  u3_rrit* wit_u = _lord_writ_new(god_u);
  wit_u->typ_m = c3__play;
  wit_u->pay_u = pay_u;

  c3_assert( !pay_u.ent_u->nex_u );

  _lord_writ_plan(god_u, wit_u);
}

/* u3_lord_work();
*/
void
u3_lord_work(u3_lord* god_u, u3_ovum* egg_u, u3_noun ovo)
{
  u3_rrit* wit_u = _lord_writ_new(god_u);
  wit_u->typ_m = c3__work;
  wit_u->wok_u = c3_calloc(sizeof(*wit_u->wok_u));
  wit_u->wok_u->egg_u = egg_u;

  {
    u3_noun now = u3_time_in_tv(&wit_u->tim_tv);
    wit_u->wok_u->job = u3nc(now, ovo);
  }

  if ( !god_u->ent_u ) {
    wit_u->wok_u->bug_l = god_u->mug_l;
  }

  _lord_writ_plan(god_u, wit_u);
}