/* globals mejs, MediaElementPlayer */
'use strict';

/**
 * @file MediaElement Playlist Feature (plugin).
 * @author r4fx
 * @author Original author: Junaid Qadir Baloch <shekhanzai.baloch@gmail.com>
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function ($) {
	$.extend(mejs.MepDefaults, {
		loopText: mejs.i18n.t('Repeat On/Off'),
		shuffleText: mejs.i18n.t('Shuffle On/Off'),
		nextText: mejs.i18n.t('Next Track'),
		prevText: mejs.i18n.t('Previous Track'),
		playlistText: mejs.i18n.t('Show/Hide Playlist')
	});

	$.extend(MediaElementPlayer.prototype, {

	    // LOOP TOGGLE
		buildloop: function (player, controls, layers, media) {
			var t = this;

			var loop = $('<div class="mejs__button mejs__loop-button mejs__button-feature ' + ((player.options.loop) ? 'mejs__loop-on' : 'mejs__loop-off') + '">' +
				'<button type="button" aria-controls="' + player.id + '" title="' + player.options.loopText + '"></button>' +
				'</div>')
				// append it to the toolbar
				.appendTo(controls)
				// add a click toggle event
				.click(function () {
					player.options.loop = !player.options.loop;
					if (player.options.loop) {
						loop.removeClass('mejs__loop-off').addClass('mejs__loop-on');
					} else {
						loop.removeClass('mejs__loop-on').addClass('mejs__loop-off');
					}
				});

			t.loopToggle = $(t.controls).find('.mejs__loop-button');
		},

		loopToggleClick: function () {
			var t = this;
			t.loopToggle.trigger('click');
		},

		// PREVIOUS TRACK BUTTON
		buildprevtrack: function (player, controls, layers, media) {
			var t = this;

			var prevTrack = $('<div class="mejs__button mejs__prevtrack-button mejs__prevtrack mejs__button-feature">' +
				'<button type="button" aria-controls="' + player.id + '" title="' + player.options.prevText + '"></button>' +
				'</div>');

			prevTrack.appendTo(controls)
				.click(function () {
					player.playPrevTrack();
				});

			t.prevTrack = $(t.controls).find('.mejs__prevtrack-button');
		},

		prevTrackClick: function () {
			var t = this;
			t.prevTrack.trigger('click');
		},

		// NEXT TRACK BUTTON
		buildnexttrack: function (player, controls, layers, media) {
			var t = this;
			var nextTrack = $('<div class="mejs__button mejs__nexttrack-button mejs__nexttrack mejs__button-feature">' +
				'<button type="button" aria-controls="' + player.id + '" title="' + player.options.nextText + '"></button>' +
				'</div>');

			nextTrack.appendTo(controls)
				.click(function () {
					player.playNextTrack();
				});

			t.nextTrack = $(t.controls).find('.mejs__nexttrack-button');
		},

		nextTrackClick: function () {
			var t = this;
			t.nextTrack.trigger('click');
		},

		// PLAYLIST TOGGLE
		buildplaylist: function (player, controls, layers, media) {
			var t = this;

			// build playlist button
			var playlistToggle = $('<div class="mejs__button mejs__playlist-button mejs__button-feature ' + ((player.options.playlist) ? 'mejs__hide-playlist' : 'mejs__show-playlist') + '">' +
				'<button type="button" aria-controls="' + player.id + '" title="' + player.options.playlistText + '"></button>' +
				'</div>');

			playlistToggle.appendTo(controls)
				.click(function () {
					// toggle playlist display
					t.togglePlaylistDisplay(player, layers, media);
				});

			t.playlistToggle = $(t.controls).find('.mejs__playlist-button');
		},
		playlistToggleClick: function () {
			var t = this;
			t.playlistToggle.trigger('click');
		},

		// PLAYLIST WINDOW
		buildplaylistfeature: function (player, controls, layers, media) {

			// add playlist view to layers
			var t = this,
				playlist = $('<div class="mejs__playlist active">' +
				'<ul></ul>' +
				'</div>')
				.insertAfter(player.container);

			// activate playlist display when data-showplaylist is set
			if (!!$(media.firstChild).data('showplaylist')) {
				player.options.playlist = true;
                player.options.loop = true;

				// hide play overlay button
				$('#' + player.id).find('.mejs__overlay-play').hide();
			}

			if(!player.options.playlist) {
				playlist.hide();
			}

			var getTrackName = function (trackUrl) {
				var trackUrlParts = trackUrl.split('/');
				if (trackUrlParts.length > 0) {
					return decodeURIComponent(trackUrlParts[trackUrlParts.length - 1]);
				} else {
					return '';
				}
			};

			// calculate tracks and build playlist
			var tracks = [],
				sourceIsPlayable,
				foundMatchingType = '';

			$('#' + player.id).find('.mejs__mediaelement source').each(function () {
				sourceIsPlayable = $(this).parent()[0].canPlayType(this.type);

				if (!foundMatchingType && (sourceIsPlayable === 'maybe' || sourceIsPlayable === 'probably')) {
					foundMatchingType = this.type;
				}

				if (!!foundMatchingType && this.type === foundMatchingType) {
					if ($.trim(this.src) !== '') {
						var track = {};
						track.source = $.trim(this.src);

						// Track name
						if ($.trim(this.title) !== '') {
							track.name = $.trim(this.title);
						} else {
							track.name = getTrackName(track.source);
						}

						// Track description
						if (this.dataset.mepDescription !== undefined ) {
                            track.description = ' - ' + $(this).data('mep-description');
						} else {
                            track.description = '';
                        }

                        tracks.push(track);
					}
				}
			});

			var $playListContainer = $(player.container.parentNode).find('.mejs__playlist');

			// Set tracks
			for (var track in tracks) {
				var $thisLi = $('<li data-url="' + tracks[track].source + '" title="' + tracks[track].name + '"><span>' + tracks[track].name + '</span> '+ tracks[track].description + ' </li>');
                $playListContainer.find('ul').append($thisLi);
			}

			// set the first track as current
            $playListContainer.find('li:first').addClass('current played');

			// play track from playlist when clicking it
            $playListContainer.find('ul li').click(function () {
				// pause current track or play other one
				if (!$(this).hasClass('current')) {
					// clicked other track - play it
					$(this).addClass('played');
					player.playTrack($(this));
				} else {
					// clicked current track - play if paused and vice versa
					if (!player.media.paused) {
						// pause if playing
						player.pause();
					} else {
						// play if paused
						player.play();
					}
				}
			});

            // when current track ends - play the next one
            media.addEventListener('ended', function () {
                player.playNextTrack();
            }, false);
		},

		playNextTrack: function () {
			var t = this, 
			    nxt;
			var tracks = $(t.container.parentNode).find('.mejs__playlist > ul > li');
			var current = tracks.filter('.current');
			var notplayed = tracks.not('.played');


			if (notplayed.length < 1) {
				current.removeClass('played').siblings().removeClass('played');
				notplayed = tracks.not('.current');
			}
			if (t.options.shuffle) {
				var random = Math.floor(Math.random() * notplayed.length);
				nxt = notplayed.eq(random);
			} else {
				nxt = current.next();
				if (nxt.length < 1 && t.options.loop) {
					nxt = current.siblings().first();
				}
			}
			if (nxt.length == 1) {
				nxt.addClass('played');
				t.playTrack(nxt);
			}
		},

		playPrevTrack: function () {
			var t = this,
			    prev;
			var tracks = $(t.container.parentNode).find('.mejs__playlist > ul > li');
			var current = tracks.filter('.current');
			var played = tracks.filter('.played').not('.current');
			if (played.length < 1) {
				current.removeClass('played');
				played = tracks.not('.current');
			}
			if (t.options.shuffle) {
				var random = Math.floor(Math.random()*played.length);
				prev = played.eq(random);
			} else {
				prev = current.prev();
				if (prev.length < 1 && t.options.loop) {
					prev = current.siblings().last();
				}
			}
			if (prev.length == 1) {
				current.removeClass('played');
				t.playTrack(prev);
			}
		},
		playTrack: function (track) {
			var t = this;
			t.pause();
			t.setSrc(track.data('url'));
			t.load();
			t.play();
			track.addClass('current').siblings().removeClass('current');
		},
		playTrackURL: function (url) {
			var t = this;
			var tracks = $(t.container.parentNode).find('.mejs__playlist > ul > li');
			var track = tracks.filter('[data-url="' + url + '"]');
			t.playTrack(track);
		},
		togglePlaylistDisplay: function (player, layers, media, showHide) {
			var t = this;

			if (!!showHide) {
				player.options.playlist = showHide === 'show' ? true : false;
			} else {
				player.options.playlist = !player.options.playlist;
			}

			// toggle playlist display
			if (player.options.playlist) {
                $(t.container.parentNode).find('.mejs__playlist').addClass('active');
				t.playlistToggle.removeClass('mejs__show-playlist').addClass('mejs__hide-playlist');
			} else {
                $(t.container.parentNode).find('.mejs__playlist').removeClass('active');
				t.playlistToggle.removeClass('mejs__hide-playlist').addClass('mejs__show-playlist');
			}
		}
	});

})(mejs.$);
