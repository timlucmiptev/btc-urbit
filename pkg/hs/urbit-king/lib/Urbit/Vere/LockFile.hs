{-|
    Acquire and release the vere lockfile.
-}

module Urbit.Vere.LockFile (lockFile) where

import Urbit.Prelude

import System.IO.LockFile.Internal (LockingParameters(..), RetryStrategy(..),
                                    lock, unlock)
import qualified System.Directory as Directory

lockFile :: HasLogFunc e => FilePath -> RAcquire e ()
lockFile pax = void $ mkRAcquire start stop
  where
    stop handle = do
        logInfo $ display @Text $ ("Releasing lock file: " <> pack path)
        io $ unlock path handle

    start = do
        io (Directory.createDirectoryIfMissing True pax)
        logInfo $ display @Text $ ("Taking lock file: " <> pack path)
        io (lock params path)

    path = pax <> "/.vere.lock"

    params =
        LockingParameters
            { retryToAcquireLock  = No
            , sleepBetweenRetries = 8_000_000 -- 8s
            }
