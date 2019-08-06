select extract(epoch from e.datetime) as datetime, l.latitude, l.longitude from appomatic_siteinfo_event e join appomatic_siteinfo_locationdata l on e.locationdata_ptr_id = l.basemodel_ptr_id order by e.datetime;
